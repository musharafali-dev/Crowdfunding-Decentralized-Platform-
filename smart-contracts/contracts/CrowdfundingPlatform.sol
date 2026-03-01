// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract CrowdfundingPlatform is ReentrancyGuard {
    enum CampaignStatus {
        Active,
        Successful,
        Failed,
        Cancelled
    }

    struct Campaign {
        address creator;
        string title;
        string description;
        uint256 goal;
        uint256 deadline;
        uint256 amountRaised;
        string imageHash; // IPFS hash
        string category;
        bool goalReached;
        bool withdrawn;
        CampaignStatus status;
    }

    // State Variables
    uint256 private campaignCount;
    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => address[]) public campaignContributors;
    mapping(uint256 => mapping(address => uint256)) public contributions;

    address public platformOwner;
    uint256 public platformFee; // In basis points (200 = 2%)
    uint256 public constant MAX_FEE = 1000; // 10% maximum

    string[] public categories;

    // Events
    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed creator,
        string title,
        uint256 goal,
        uint256 deadline,
        string category
    );

    event ContributionMade(
        uint256 indexed campaignId,
        address indexed contributor,
        uint256 amount,
        uint256 totalRaised
    );

    event FundsWithdrawn(
        uint256 indexed campaignId,
        address indexed creator,
        uint256 amount
    );

    event RefundClaimed(
        uint256 indexed campaignId,
        address indexed contributor,
        uint256 amount
    );

    event CampaignCancelled(
        uint256 indexed campaignId
    );

    event CampaignStatusChanged(
        uint256 indexed campaignId,
        CampaignStatus status
    );

    event PlatformFeeChanged(
        uint256 newFee
    );

    event CategoryAdded(
        string category
    );

    // Modifiers
    modifier onlyCreator(uint256 _campaignId) {
        require(campaigns[_campaignId].creator == msg.sender, "Not campaign creator");
        _;
    }

    modifier campaignExists(uint256 _campaignId) {
        require(_campaignId < campaignCount, "Campaign does not exist");
        _;
    }

    modifier beforeDeadline(uint256 _campaignId) {
        require(block.timestamp < campaigns[_campaignId].deadline, "Deadline passed");
        _;
    }

    modifier afterDeadline(uint256 _campaignId) {
        require(
            block.timestamp >= campaigns[_campaignId].deadline || 
            campaigns[_campaignId].status == CampaignStatus.Cancelled,
            "Deadline not reached"
        );
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == platformOwner, "Not platform owner");
        _;
    }

    constructor(uint256 _platformFee) {
        require(_platformFee <= MAX_FEE, "Fee exceeds maximum limit");
        platformOwner = msg.sender;
        platformFee = _platformFee;
        
        // Seed default categories
        categories.push("Technology");
        categories.push("Art");
        categories.push("Community");
        categories.push("Charity");
        categories.push("Fashion");
        categories.push("Film");
    }

    // Write Functions
    function createCampaign(
        string memory _title,
        string memory _description,
        uint256 _goal,
        uint256 _durationInDays,
        string memory _imageHash,
        string memory _category
    ) external payable returns (uint256) {
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(bytes(_description).length > 0, "Description cannot be empty");
        require(_goal > 0, "Goal must be greater than 0");
        require(_durationInDays > 0, "Duration must be greater than 0");
        
        // Verify category exists
        bool categoryValid = false;
        for (uint256 i = 0; i < categories.length; i++) {
            if (keccak256(bytes(categories[i])) == keccak256(bytes(_category))) {
                categoryValid = true;
                break;
            }
        }
        require(categoryValid, "Invalid campaign category");

        uint256 campaignId = campaignCount;
        uint256 deadline = block.timestamp + (_durationInDays * 1 days);

        campaigns[campaignId] = Campaign({
            creator: msg.sender,
            title: _title,
            description: _description,
            goal: _goal,
            deadline: deadline,
            amountRaised: 0,
            imageHash: _imageHash,
            category: _category,
            goalReached: false,
            withdrawn: false,
            status: CampaignStatus.Active
        });

        campaignCount++;

        emit CampaignCreated(
            campaignId,
            msg.sender,
            _title,
            _goal,
            deadline,
            _category
        );

        // Handle initial contribution if creator sends value
        if (msg.value > 0) {
            campaigns[campaignId].amountRaised = msg.value;
            contributions[campaignId][msg.sender] = msg.value;
            campaignContributors[campaignId].push(msg.sender);

            if (msg.value >= _goal) {
                campaigns[campaignId].goalReached = true;
            }

            emit ContributionMade(campaignId, msg.sender, msg.value, msg.value);
        }

        return campaignId;
    }

    function contribute(uint256 _campaignId) 
        external 
        payable 
        campaignExists(_campaignId) 
        beforeDeadline(_campaignId) 
        nonReentrant 
    {
        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.status == CampaignStatus.Active, "Campaign is not active");
        require(msg.value > 0, "Contribution must be greater than 0");

        // If contributor is new, register them
        if (contributions[_campaignId][msg.sender] == 0) {
            campaignContributors[_campaignId].push(msg.sender);
        }

        contributions[_campaignId][msg.sender] += msg.value;
        campaign.amountRaised += msg.value;

        if (campaign.amountRaised >= campaign.goal) {
            campaign.goalReached = true;
        }

        emit ContributionMade(_campaignId, msg.sender, msg.value, campaign.amountRaised);
    }

    function withdrawFunds(uint256 _campaignId) 
        external 
        onlyCreator(_campaignId) 
        campaignExists(_campaignId) 
        afterDeadline(_campaignId) 
        nonReentrant 
    {
        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.amountRaised >= campaign.goal, "Goal not met");
        require(!campaign.withdrawn, "Funds already withdrawn");
        require(campaign.status != CampaignStatus.Cancelled, "Campaign was cancelled");

        campaign.withdrawn = true;
        campaign.status = CampaignStatus.Successful;

        uint256 totalAmount = campaign.amountRaised;
        uint256 feeAmount = (totalAmount * platformFee) / 10000;
        uint256 creatorShare = totalAmount - feeAmount;

        // Perform transfers
        if (feeAmount > 0) {
            (bool feeSuccess, ) = platformOwner.call{value: feeAmount}("");
            require(feeSuccess, "Platform fee transfer failed");
        }

        (bool withdrawSuccess, ) = campaign.creator.call{value: creatorShare}("");
        require(withdrawSuccess, "Creator fund transfer failed");

        emit FundsWithdrawn(_campaignId, campaign.creator, creatorShare);
        emit CampaignStatusChanged(_campaignId, CampaignStatus.Successful);
    }

    function claimRefund(uint256 _campaignId) 
        external 
        campaignExists(_campaignId) 
        afterDeadline(_campaignId) 
        nonReentrant 
    {
        Campaign storage campaign = campaigns[_campaignId];
        
        // Campaign must have failed or been cancelled
        // Failed = deadline reached and goal not met
        bool isFailed = (block.timestamp >= campaign.deadline && campaign.amountRaised < campaign.goal);
        bool isCancelled = (campaign.status == CampaignStatus.Cancelled);
        require(isFailed || isCancelled, "Campaign is successful or active");

        uint256 refundAmount = contributions[_campaignId][msg.sender];
        require(refundAmount > 0, "No contributions to refund");

        // Clear contribution first to prevent reentrancy
        contributions[_campaignId][msg.sender] = 0;

        // Update campaign status to Failed if not already updated and not cancelled
        if (campaign.status == CampaignStatus.Active && !isCancelled) {
            campaign.status = CampaignStatus.Failed;
            emit CampaignStatusChanged(_campaignId, CampaignStatus.Failed);
        }

        (bool success, ) = msg.sender.call{value: refundAmount}("");
        require(success, "Refund transfer failed");

        emit RefundClaimed(_campaignId, msg.sender, refundAmount);
    }

    function cancelCampaign(uint256 _campaignId) 
        external 
        onlyCreator(_campaignId) 
        campaignExists(_campaignId) 
        beforeDeadline(_campaignId) 
    {
        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.status == CampaignStatus.Active, "Campaign is not active");

        campaign.status = CampaignStatus.Cancelled;

        emit CampaignCancelled(_campaignId);
        emit CampaignStatusChanged(_campaignId, CampaignStatus.Cancelled);
    }

    // Owner Functions
    function setPlatformFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= MAX_FEE, "Fee exceeds maximum limit");
        platformFee = _newFee;
        emit PlatformFeeChanged(_newFee);
    }

    function addCategory(string calldata _category) external onlyOwner {
        require(bytes(_category).length > 0, "Category cannot be empty");
        
        // Check if category already exists
        for (uint256 i = 0; i < categories.length; i++) {
            require(
                keccak256(bytes(categories[i])) != keccak256(bytes(_category)),
                "Category already exists"
            );
        }
        
        categories.push(_category);
        emit CategoryAdded(_category);
    }

    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid address");
        platformOwner = _newOwner;
    }

    // Read Functions
    function getCampaign(uint256 _campaignId) 
        external 
        view 
        campaignExists(_campaignId) 
        returns (Campaign memory) 
    {
        return campaigns[_campaignId];
    }

    function getCampaigns() external view returns (Campaign[] memory) {
        Campaign[] memory allCampaigns = new Campaign[](campaignCount);
        for (uint256 i = 0; i < campaignCount; i++) {
            allCampaigns[i] = campaigns[i];
        }
        return allCampaigns;
    }

    function getActiveCampaigns() external view returns (Campaign[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < campaignCount; i++) {
            if (
                campaigns[i].status == CampaignStatus.Active && 
                block.timestamp < campaigns[i].deadline
            ) {
                activeCount++;
            }
        }

        Campaign[] memory activeCampaigns = new Campaign[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < campaignCount; i++) {
            if (
                campaigns[i].status == CampaignStatus.Active && 
                block.timestamp < campaigns[i].deadline
            ) {
                activeCampaigns[index] = campaigns[i];
                index++;
            }
        }
        return activeCampaigns;
    }

    function getContributors(uint256 _campaignId) 
        external 
        view 
        campaignExists(_campaignId) 
        returns (address[] memory) 
    {
        return campaignContributors[_campaignId];
    }

    function getContribution(uint256 _campaignId, address _contributor) 
        external 
        view 
        campaignExists(_campaignId) 
        returns (uint256) 
    {
        return contributions[_campaignId][_contributor];
    }

    function getCampaignCount() external view returns (uint256) {
        return campaignCount;
    }

    function getCategories() external view returns (string[] memory) {
        return categories;
    }
}
