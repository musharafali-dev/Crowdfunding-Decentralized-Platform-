const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CrowdfundingPlatform", function () {
  let CrowdfundingPlatform;
  let contract;
  let owner;
  let creator;
  let contributor1;
  let contributor2;
  let addrs;
  const initialFee = 200; // 2% basis points

  beforeEach(async function () {
    [owner, creator, contributor1, contributor2, ...addrs] = await ethers.getSigners();
    CrowdfundingPlatform = await ethers.getContractFactory("CrowdfundingPlatform");
    contract = await CrowdfundingPlatform.deploy(initialFee);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await contract.platformOwner()).to.equal(owner.address);
    });

    it("Should set the right platform fee", async function () {
      expect(await contract.platformFee()).to.equal(initialFee);
    });

    it("Should seed default categories", async function () {
      const categories = await contract.getCategories();
      expect(categories).to.include("Technology");
      expect(categories).to.include("Art");
      expect(categories).to.include("Community");
    });
  });

  describe("Campaign Creation", function () {
    it("Should create a campaign with valid parameters", async function () {
      const title = "New Gadget";
      const desc = "A cool new gadget";
      const goal = ethers.parseEther("10");
      const duration = 30; // 30 days
      const imageHash = "QmIPFSImageHash";
      const category = "Technology";

      const tx = await contract.connect(creator).createCampaign(title, desc, goal, duration, imageHash, category);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);
      const expectedDeadline = block.timestamp + (duration * 24 * 60 * 60);

      await expect(tx)
        .to.emit(contract, "CampaignCreated")
        .withArgs(0, creator.address, title, goal, expectedDeadline, category);

      const campaign = await contract.getCampaign(0);
      expect(campaign.creator).to.equal(creator.address);
      expect(campaign.title).to.equal(title);
      expect(campaign.goal).to.equal(goal);
      expect(campaign.category).to.equal(category);
      expect(campaign.status).to.equal(0); // CampaignStatus.Active
    });

    it("Should bootstrap campaign with initial creator value", async function () {
      const goal = ethers.parseEther("10");
      const bootstrapVal = ethers.parseEther("1");

      await expect(
        contract.connect(creator).createCampaign(
          "Gadget",
          "Cool gadget",
          goal,
          30,
          "hash",
          "Technology",
          { value: bootstrapVal }
        )
      )
        .to.emit(contract, "ContributionMade")
        .withArgs(0, creator.address, bootstrapVal, bootstrapVal);

      const campaign = await contract.getCampaign(0);
      expect(campaign.amountRaised).to.equal(bootstrapVal);
      
      const contribution = await contract.getContribution(0, creator.address);
      expect(contribution).to.equal(bootstrapVal);
    });

    it("Should fail if goal is 0", async function () {
      await expect(
        contract.connect(creator).createCampaign("Title", "Desc", 0, 30, "hash", "Technology")
      ).to.be.revertedWith("Goal must be greater than 0");
    });

    it("Should fail if duration is 0", async function () {
      await expect(
        contract.connect(creator).createCampaign("Title", "Desc", 100, 0, "hash", "Technology")
      ).to.be.revertedWith("Duration must be greater than 0");
    });

    it("Should fail if category is invalid", async function () {
      await expect(
        contract.connect(creator).createCampaign("Title", "Desc", 100, 30, "hash", "InvalidCategory")
      ).to.be.revertedWith("Invalid campaign category");
    });
  });

  describe("Contributions", function () {
    beforeEach(async function () {
      await contract.connect(creator).createCampaign(
        "Gadget",
        "Cool gadget",
        ethers.parseEther("5"),
        30,
        "hash",
        "Technology"
      );
    });

    it("Should accept valid contribution and update total raised", async function () {
      const amount = ethers.parseEther("1");
      await expect(
        contract.connect(contributor1).contribute(0, { value: amount })
      )
        .to.emit(contract, "ContributionMade")
        .withArgs(0, contributor1.address, amount, amount);

      const campaign = await contract.getCampaign(0);
      expect(campaign.amountRaised).to.equal(amount);

      const contribution = await contract.getContribution(0, contributor1.address);
      expect(contribution).to.equal(amount);
    });

    it("Should track contributors list uniquely", async function () {
      await contract.connect(contributor1).contribute(0, { value: ethers.parseEther("1") });
      await contract.connect(contributor1).contribute(0, { value: ethers.parseEther("2") });
      await contract.connect(contributor2).contribute(0, { value: ethers.parseEther("1") });

      const contributors = await contract.getContributors(0);
      expect(contributors.length).to.equal(2);
      expect(contributors[0]).to.equal(contributor1.address);
      expect(contributors[1]).to.equal(contributor2.address);
    });

    it("Should update goalReached flag once goal is met", async function () {
      await contract.connect(contributor1).contribute(0, { value: ethers.parseEther("4") });
      expect((await contract.getCampaign(0)).goalReached).to.be.false;

      await contract.connect(contributor2).contribute(0, { value: ethers.parseEther("1.5") });
      expect((await contract.getCampaign(0)).goalReached).to.be.true;
    });

    it("Should fail contribution if campaign does not exist", async function () {
      await expect(
        contract.connect(contributor1).contribute(999, { value: ethers.parseEther("1") })
      ).to.be.revertedWith("Campaign does not exist");
    });

    it("Should fail contribution if amount is 0", async function () {
      await expect(
        contract.connect(contributor1).contribute(0, { value: 0 })
      ).to.be.revertedWith("Contribution must be greater than 0");
    });
  });

  describe("Withdrawals & Platform Fees", function () {
    const goal = ethers.parseEther("10");

    beforeEach(async function () {
      await contract.connect(creator).createCampaign("Tech", "Desc", goal, 1, "hash", "Technology");
      await contract.connect(contributor1).contribute(0, { value: ethers.parseEther("11") });
    });

    it("Should fail withdrawal before deadline", async function () {
      await expect(
        contract.connect(creator).withdrawFunds(0)
      ).to.be.revertedWith("Deadline not reached");
    });

    it("Should withdraw and apply fee after deadline if goal met", async function () {
      // Fast-forward time past deadline
      await ethers.provider.send("evm_increaseTime", [24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine");

      const raised = ethers.parseEther("11");
      const expectedFee = (raised * BigInt(initialFee)) / 10000n; // 2% fee
      const expectedCreatorShare = raised - expectedFee;

      const initialCreatorBal = await ethers.provider.getBalance(creator.address);
      const initialOwnerBal = await ethers.provider.getBalance(owner.address);

      // Perform withdrawal
      const tx = await contract.connect(creator).withdrawFunds(0);
      const receipt = await tx.wait();
      const gasSpent = receipt.gasUsed * receipt.gasPrice;

      // Check balances
      const finalCreatorBal = await ethers.provider.getBalance(creator.address);
      const finalOwnerBal = await ethers.provider.getBalance(owner.address);

      expect(finalCreatorBal).to.equal(initialCreatorBal + expectedCreatorShare - gasSpent);
      expect(finalOwnerBal).to.equal(initialOwnerBal + expectedFee);

      const campaign = await contract.getCampaign(0);
      expect(campaign.withdrawn).to.be.true;
      expect(campaign.status).to.equal(1); // Successful
    });

    it("Should fail double withdrawal", async function () {
      await ethers.provider.send("evm_increaseTime", [24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine");

      await contract.connect(creator).withdrawFunds(0);

      await expect(
        contract.connect(creator).withdrawFunds(0)
      ).to.be.revertedWith("Funds already withdrawn");
    });

    it("Should fail if unauthorized caller tries to withdraw", async function () {
      await ethers.provider.send("evm_increaseTime", [24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine");

      await expect(
        contract.connect(contributor1).withdrawFunds(0)
      ).to.be.revertedWith("Not campaign creator");
    });
  });

  describe("Refunds & Cancellations", function () {
    const goal = ethers.parseEther("10");

    beforeEach(async function () {
      await contract.connect(creator).createCampaign("Art Project", "Desc", goal, 1, "hash", "Art");
      await contract.connect(contributor1).contribute(0, { value: ethers.parseEther("3") });
      await contract.connect(contributor2).contribute(0, { value: ethers.parseEther("4") });
    });

    it("Should fail refund claim before deadline", async function () {
      await expect(
        contract.connect(contributor1).claimRefund(0)
      ).to.be.revertedWith("Deadline not reached");
    });

    it("Should fail refund claim after deadline if goal was met", async function () {
      await contract.connect(contributor1).contribute(0, { value: ethers.parseEther("4") }); // Goal met
      await ethers.provider.send("evm_increaseTime", [24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine");

      await expect(
        contract.connect(contributor1).claimRefund(0)
      ).to.be.revertedWith("Campaign is successful or active");
    });

    it("Should refund contributor correctly if goal is not met after deadline", async function () {
      await ethers.provider.send("evm_increaseTime", [24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine");

      const refundAmount = ethers.parseEther("3");
      const initialBal = await ethers.provider.getBalance(contributor1.address);

      const tx = await contract.connect(contributor1).claimRefund(0);
      const receipt = await tx.wait();
      const gasSpent = receipt.gasUsed * receipt.gasPrice;

      const finalBal = await ethers.provider.getBalance(contributor1.address);
      expect(finalBal).to.equal(initialBal + refundAmount - gasSpent);

      // Verify contribution reset
      expect(await contract.getContribution(0, contributor1.address)).to.equal(0);
    });

    it("Should fail refund claim if user has no contributions", async function () {
      await ethers.provider.send("evm_increaseTime", [24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine");

      await expect(
        contract.connect(creator).claimRefund(0)
      ).to.be.revertedWith("No contributions to refund");
    });

    it("Should allow creator to cancel campaign and contributors to claim refund immediately", async function () {
      // Cancel before deadline
      await expect(contract.connect(creator).cancelCampaign(0))
        .to.emit(contract, "CampaignCancelled")
        .withArgs(0);

      // Refund claim should succeed immediately without waiting for deadline
      const refundAmount = ethers.parseEther("3");
      const initialBal = await ethers.provider.getBalance(contributor1.address);

      const tx = await contract.connect(contributor1).claimRefund(0);
      const receipt = await tx.wait();
      const gasSpent = receipt.gasUsed * receipt.gasPrice;

      const finalBal = await ethers.provider.getBalance(contributor1.address);
      expect(finalBal).to.equal(initialBal + refundAmount - gasSpent);
    });

    it("Should fail cancellation if not creator", async function () {
      await expect(
        contract.connect(contributor1).cancelCampaign(0)
      ).to.be.revertedWith("Not campaign creator");
    });
  });

  describe("Owner settings", function () {
    it("Should update platform fee correctly by owner", async function () {
      await expect(contract.connect(owner).setPlatformFee(300))
        .to.emit(contract, "PlatformFeeChanged")
        .withArgs(300);

      expect(await contract.platformFee()).to.equal(300);
    });

    it("Should fail fee update if fee > MAX_FEE", async function () {
      await expect(
        contract.connect(owner).setPlatformFee(1500)
      ).to.be.revertedWith("Fee exceeds maximum limit");
    });

    it("Should fail fee update if not owner", async function () {
      await expect(
        contract.connect(creator).setPlatformFee(300)
      ).to.be.revertedWith("Not platform owner");
    });

    it("Should add category correctly by owner", async function () {
      await expect(contract.connect(owner).addCategory("Education"))
        .to.emit(contract, "CategoryAdded")
        .withArgs("Education");

      const categories = await contract.getCategories();
      expect(categories).to.include("Education");
    });

    it("Should fail to add duplicate category", async function () {
      await expect(
        contract.connect(owner).addCategory("Technology")
      ).to.be.revertedWith("Category already exists");
    });

    it("Should transfer ownership correctly", async function () {
      await contract.connect(owner).transferOwnership(creator.address);
      expect(await contract.platformOwner()).to.equal(creator.address);
    });
  });
});
