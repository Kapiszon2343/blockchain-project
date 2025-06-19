import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";
import * as secp from '@noble/secp256k1';
import { sign } from "@noble/secp256k1";
import { sha256 } from "@noble/hashes/sha256";
import { BigNumberish, hexlify } from "ethers";

describe("Publishing", function () {
  function getTextHash(message: string): Uint8Array {
    const encoded = new TextEncoder().encode(message); // UTF-8 encode text
    return sha256(encoded); // SHA-256 hash
  }

  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
  async function deployFreshContract() {
    // Contracts are deployed using the first signer/account by default
    const [owner, other1, other2] = await hre.ethers.getSigners();

    const Publishing = await hre.ethers.getContractFactory("Publishing");
    const contract = await Publishing.deploy();

    return { contract, owner, other1, other2 };
  }

  describe("Deployment", function () {
    it("Should set right owner", async function () {
      const { contract, owner, other1, other2 } = await loadFixture(deployFreshContract);

      expect(await contract.getOwner()).to.equal(owner);
    });

    it("Should set right total", async function () {
      const { contract, owner, other1, other2 } = await loadFixture(deployFreshContract);

      expect(await contract.totalSupply()).to.equal(0);
    });

    it("Should set right balance", async function () {
      const { contract, owner, other1, other2 } = await loadFixture(deployFreshContract);

      expect(await contract.balanceOf(owner)).to.equal(0);
    });

    it("Should set right all approval", async function (){
      const { contract, owner, other1, other2 } = await loadFixture(deployFreshContract);

      expect(await contract.isApprovedForAll(owner, other1)).to.equal(false);
    });

    it("Wrong token throws", async function (){
      const { contract, owner, other1, other2 } = await loadFixture(deployFreshContract);

      await expect(contract.ownerOf(2))
        .to.be.revertedWith("Token with this Id doesn't exist");
    });

    it("should support IERC721 interface", async function () {
      const { contract, owner, other1, other2 } = await loadFixture(deployFreshContract);
      // IERC721 interface ID = 0x80ac58cd (from EIP-165 spec)
      const IERC721_ID = "0x80ac58cd";
      expect(await contract.supportsInterface(IERC721_ID)).to.equal(true);
    });

    it("should not support random interface", async function () {
      const { contract, owner, other1, other2 } = await loadFixture(deployFreshContract);
      const fakeInterfaceId = "0x12345678";
      expect(await contract.supportsInterface(fakeInterfaceId)).to.equal(false);
    });
  });

  const titles1 = ['title1'];
  async function deployFreshContractWithPublishing() {
    const { contract, owner, other1, other2 } = await loadFixture(deployFreshContract);

    const tokenId = [];
    for (let i = 0; i < titles1.length; i++) {
      const tx = await contract.connect(other1).publish(titles1[i]);
      const receipt = await tx.wait();
      expect(receipt, "Publish function could not be called").to.exist;

      // Find the 'Publish' event and extract tokenId
      const iface = contract.interface;
      const publishEvent = receipt?.logs?.map(log => {
            try {
              return iface.parseLog(log);
            } catch {
              return null;
            }
          })
          .find(log => log?.name === "Publish");
      if (!publishEvent) {
        throw new Error("Publish event not found");
      }

      expect(publishEvent.args?.owner).to.equal(other1.address)
      expect(publishEvent.args?.title).to.equal(titles1[i])
      tokenId.push(publishEvent.args?.tokenId)
    }

    return { contract, tokenId, owner, other1, other2 };
  }

  describe("Publishing", function () {
    it("Should set right owner", async function () {
      const { contract, tokenId, owner, other1, other2 } = await deployFreshContractWithPublishing();

      expect(await contract.ownerOf(tokenId[0])).to.equal(other1);
    });

    it("Should count balance", async function () {
      const { contract, tokenId, owner, other1, other2 } = await deployFreshContractWithPublishing();

      expect(await contract.balanceOf(other1)).to.equal(titles1.length);
    });

    it("Should set right approval", async function () {
      const { contract, tokenId, owner, other1, other2 } = await deployFreshContractWithPublishing();

      expect(await contract.getApproved(tokenId[0])).to.equal(ZERO_ADDRESS);
    });
  });

  describe("NewChapter", function() {
    const chapterContent1 = [['Prologue', 'chapter2: electric boogaloo']];

    it("Should emit newChapter", async function () {
      const { contract, tokenId, owner, other1, other2 } = await deployFreshContractWithPublishing();

      for (let i = 0; i < chapterContent1.length; i++) {
        const hash = getTextHash(chapterContent1[0][i])
        expect(await contract.connect(other1).publishChapter(tokenId[0], i, hash))
          .to.emit(contract, 'NewChapter')
          .withArgs(tokenId[0], i, hash);
      }
    });

    it("New chapter checks for owner", async function () {
      const { contract, tokenId, owner, other1, other2 } = await deployFreshContractWithPublishing();

      for (let i = 0; i < chapterContent1.length; i++) {
        const hash = getTextHash(chapterContent1[0][i])
        await expect(contract.connect(other2).publishChapter(tokenId[0], i, hash))
          .to.be.revertedWith("You don't have acces to this token");
      }
    });

    it("New chapter can use approval", async function () {
      const { contract, tokenId, owner, other1, other2 } = await deployFreshContractWithPublishing();
      expect(await contract.connect(other1).approve(other2, tokenId[0]))
        .to.emit(contract, "Approval")
        .withArgs(other2, other1, tokenId[0]);

      for (let i = 0; i < chapterContent1.length; i++) {
        const hash = getTextHash(chapterContent1[0][i])
        expect(await contract.connect(other2).publishChapter(tokenId[0], i, hash))
          .to.emit(contract, 'NewChapter')
          .withArgs(tokenId[0], i, hash);
      }
    });

    it("New chapter can use approve all", async function () {
      const { contract, tokenId, owner, other1, other2 } = await deployFreshContractWithPublishing();
      expect(await contract.connect(other1).setApprovalForAll(other2, true))
        .to.emit(contract, "ApprovalForAll")
        .withArgs(other2, other1, true);

      for (let i = 0; i < chapterContent1.length; i++) {
        const hash = getTextHash(chapterContent1[0][i])
        expect(await contract.connect(other2).publishChapter(tokenId[0], i, hash))
          .to.emit(contract, 'NewChapter')
          .withArgs(tokenId[0], i, hash);
      }
    });

    it("New chapter works after giving approval", async function () {
      const { contract, tokenId, owner, other1, other2 } = await deployFreshContractWithPublishing();
      expect(await contract.connect(other1).approve(other2, tokenId[0]))
        .to.emit(contract, "Approval")
        .withArgs(other2, other1, tokenId[0]);

      for (let i = 0; i < chapterContent1.length; i++) {
        const hash = getTextHash(chapterContent1[0][i])
        expect(await contract.connect(other1).publishChapter(tokenId[0], i, hash))
          .to.emit(contract, 'NewChapter')
          .withArgs(tokenId[0], i, hash);
      }
    });
  })

  describe("Transfer", function () {
    it("Transfer from owner", async function () {
      const { contract, tokenId, owner, other1, other2 } = await deployFreshContractWithPublishing();
  
      // Transfer 200 tokens from owner to addr1
      expect(await contract.connect(other1).transferFrom(other1.address, other2.address, tokenId[0]))
        .to.emit(contract, "Transfer")
        .withArgs(other1, other2, tokenId[0]);
      expect(await contract.balanceOf(other2.address)).to.equal(1);
    });

    it("Transfer only from owner", async function () {
      const { contract, tokenId, owner, other1, other2 } = await deployFreshContractWithPublishing();

      await expect(contract.connect(other1).transferFrom(other2.address, owner, tokenId[0]))
        .to.be.revertedWith("Wrong token owner");
    });

    it("Only owner can transfer", async function () {
      const { contract, tokenId, owner, other1, other2 } = await deployFreshContractWithPublishing();

      await expect(contract.connect(other2).transferFrom(other1.address, owner, tokenId[0]))
        .to.be.revertedWith("Sender is not approved to transfer this token");
    });

    it("Safe transfer from owner", async function () {
      const { contract, tokenId, owner, other1, other2 } = await deployFreshContractWithPublishing();
  
      // Transfer 200 tokens from owner to addr1
      expect(await contract.connect(other1).safeTransferFrom(other1.address, other2.address, tokenId[0]))
        .to.emit(contract, "Transfer")
        .withArgs(other1, other2, tokenId[0]);
      expect(await contract.balanceOf(other2.address)).to.equal(1);
    });

    it("Safe transfer only from owner", async function () {
      const { contract, tokenId, owner, other1, other2 } = await deployFreshContractWithPublishing();

      await expect(contract.connect(other1).safeTransferFrom(other2.address, owner, tokenId[0]))
        .to.be.revertedWith("Wrong token owner");
    });

    it("Only owner can safe transfer", async function () {
      const { contract, tokenId, owner, other1, other2 } = await deployFreshContractWithPublishing();

      await expect(contract.connect(other2).safeTransferFrom(other1.address, owner, tokenId[0]))
        .to.be.revertedWith("Sender is not approved to transfer this token");
    });
  });

  describe("Allowance", function () {
    it("Wrong tokenId reverts", async function () {
      const { contract, tokenId, owner, other1, other2 } = await deployFreshContractWithPublishing();

      await expect(contract.connect(other1).approve(owner.address, 6969))
        .to.be.revertedWith("Token with this Id doesn't exist")
    })

    it("Only owner can approve", async function () {
      const { contract, tokenId, owner, other1, other2 } = await deployFreshContractWithPublishing();

      await expect(contract.connect(other2).approve(owner.address, tokenId[0]))
        .to.be.revertedWith("This is not your token")
    })

    it("Only owner can approve", async function () {
      const { contract, tokenId, owner, other1, other2 } = await deployFreshContractWithPublishing();

      await expect(contract.getApproved(6969))
        .to.be.revertedWith("Token with this Id doesn't exist")
    })

    it("Give allow all", async function () {
      const { contract, tokenId, owner, other1, other2 } = await deployFreshContractWithPublishing();

      expect(await contract.setApprovalForAll(other1, true))
        .to.emit(contract, "ApprovalForAll")
        .withArgs(owner, other1, true);
      expect(await contract.isApprovedForAll(owner, other1)).to.equal(true);
    }); 

    it("Trasfer with allow all", async function () {
      const { contract, tokenId, owner, other1, other2 } = await deployFreshContractWithPublishing();

      expect(await contract.connect(other1).setApprovalForAll(other2, true))
        .to.emit(contract, "ApprovalForAll")
        .withArgs(other1, other2, true);
      expect(await contract.isApprovedForAll(other1, other2)).to.equal(true);

      expect(await contract.connect(other2).transferFrom(other1, other2, tokenId[0]))
        .to.emit(contract, "Transfer")
        .withArgs(other1, other2, tokenId[0]);
      expect(await contract.balanceOf(other1)).to.equal(tokenId.length-1);
      expect(await contract.balanceOf(other2)).to.equal(1);
    }); 

    it("Give token allowance", async function () {
      const { contract, tokenId, owner, other1, other2 } = await deployFreshContractWithPublishing();

      expect(await contract.connect(other1).approve(owner.address, tokenId[0]))
        .to.emit(contract, "Approval")
        .withArgs(other1, owner, tokenId[0]);
      expect(await contract.getApproved(tokenId[0])).to.equal(owner.address);
    }); 

    it("Trasfer with token aloowance", async function () {
      const { contract, tokenId, owner, other1, other2 } = await deployFreshContractWithPublishing();

      expect(await contract.connect(other1).approve(other2.address, tokenId[0]))
        .to.emit(contract, "Approval")
        .withArgs(other1, other2, tokenId[0]);
      expect(await contract.getApproved(tokenId[0])).to.equal(other2.address);

      expect(await contract.connect(other2).transferFrom(other1, other2, tokenId[0]))
        .to.emit(contract, "Transfer")
        .withArgs(other1, other2, tokenId[0]);
      expect(await contract.balanceOf(other1)).to.equal(tokenId.length-1);
      expect(await contract.balanceOf(other2)).to.equal(1);
    }); 
  });

});
