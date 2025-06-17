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
import { hexlify } from "ethers";

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


  })

});
