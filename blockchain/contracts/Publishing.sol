//SPDX-License-Identifier: UNLICENSED

// Solidity files have to start with this pragma.
// It will be used by the Solidity compiler to validate its version.
pragma solidity ^0.8.0;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC721Metadata} from "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";


import "@openzeppelin/contracts/utils/Strings.sol";

contract Publishing is IERC721 {
    string public _name = "Publishing";
    string public _symbol = "PBSH";

    address public _owner;
    uint256 internal _totalSupply;

    mapping(address => uint256) _balances;
    mapping(uint256 => address) _tokenOwner;
    mapping(uint256 => address) _tokenApproval;
    mapping(address => mapping(address => bool)) _accountApproval;

    mapping(bytes4 => bool) _supportedInterfaces;

    mapping(uint256 => string) public titles;
    mapping(uint256 => mapping(uint64 => bytes)) public chapterHash;
    mapping(uint256 => mapping(uint64 => uint256)) public chapterTimestamp;

    event Publish(
        address owner, 
        uint256 tokenId, 
        string title
    );
    event NewChapter(
        uint256 tokenId,
        uint64 chapterId,
        bytes hash
    );

    constructor() {
        // The totalSupply is assigned to the transaction sender, which is the
        // account that is deploying the contract.
        _totalSupply = 0;
        _owner = msg.sender;

        _supportedInterfaces[type(IERC721).interfaceId] = true;
    }

    function getOwner() external view returns (address) {
        return _owner;
    }

    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    function supportsInterface(
        bytes4 interfaceId
    ) external view override returns (bool) {
        return _supportedInterfaces[interfaceId];
    }

    function balanceOf(
        address owner
    ) external view override returns (uint256 balance) {
        return _balances[owner];
    }

    function ownerOf(
        uint256 tokenId
    ) external view override returns (address owner) {
        require(tokenId < _totalSupply, "Token with this Id doesn't exist");
        return _tokenOwner[tokenId];
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes calldata data
    ) external override {
        require(_tokenOwner[tokenId] == from, "Wrong token owner");
        require(
            from == msg.sender ||
                _accountApproval[from][msg.sender] ||
                _tokenApproval[tokenId] == msg.sender,
            "Sender is not approved to transfer this token"
        );

        if (to.code.length > 0) {
            try IERC721Receiver(to).onERC721Received(msg.sender, from, tokenId, data) returns (bytes4 retval) {
                require(retval == IERC721Receiver.onERC721Received.selector, "ERC721: recipient contract did not accept the token");
            } catch (bytes memory reason) {
                if (reason.length == 0) {
                    revert("ERC721: transfer to non ERC721Receiver implementer");
                } else {
                    /// @solidity memory-safe-assembly
                    assembly {
                        revert(add(reason, 32), mload(reason))
                    }
                }
            }
        }

        _tokenApproval[tokenId] = address(0);
        // Transfer the value.
        _balances[from] -= 1;
        _balances[to] += 1;
        _tokenOwner[tokenId] = to;

        // Notify off-chain applications of the transfer.
        emit Transfer(from, to, tokenId);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) external override {
        require(_tokenOwner[tokenId] == from, "Wrong token owner");
        require(
            from == msg.sender ||
                _accountApproval[from][msg.sender] ||
                _tokenApproval[tokenId] == msg.sender,
            "Sender is not approved to transfer this token"
        );

        if (to.code.length > 0) {
            try IERC721Receiver(to).onERC721Received(msg.sender, from, tokenId, "") returns (bytes4 retval) {
                require(retval == IERC721Receiver.onERC721Received.selector, "ERC721: recipient contract did not accept the token");
            } catch (bytes memory reason) {
                if (reason.length == 0) {
                    revert("ERC721: transfer to non ERC721Receiver implementer");
                } else {
                    /// @solidity memory-safe-assembly
                    assembly {
                        revert(add(reason, 32), mload(reason))
                    }
                }
            }
        }

        _tokenApproval[tokenId] = address(0);
        // Transfer the value.
        _balances[from] -= 1;
        _balances[to] += 1;
        _tokenOwner[tokenId] = to;

        // Notify off-chain applications of the transfer.
        emit Transfer(from, to, tokenId);
    }

    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) external override {
        require(_tokenOwner[tokenId] == from, "Wrong token owner");
        require(
            from == msg.sender ||
                _accountApproval[from][msg.sender] ||
                _tokenApproval[tokenId] == msg.sender,
            "Sender is not approved to transfer this token"
        );

        _tokenApproval[tokenId] = address(0);
        // Transfer the value.
        _balances[from] -= 1;
        _balances[to] += 1;
        _tokenOwner[tokenId] = to;

        // Notify off-chain applications of the transfer.
        emit Transfer(from, to, tokenId);
    }

    function approve(address to, uint256 tokenId) external override {
        require(tokenId < _totalSupply, "Token with this Id doesn't exist");
        require(_tokenOwner[tokenId] == msg.sender, "This is not your token");

        _tokenApproval[tokenId] = to;

        emit Approval(msg.sender, to, tokenId);
    }

    function setApprovalForAll(
        address operator,
        bool approved
    ) external override {
        _accountApproval[msg.sender][operator] = approved;

        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function getApproved(
        uint256 tokenId
    ) external view override returns (address operator) {
        require(tokenId < _totalSupply, "Token with this Id doesn't exist");
        return _tokenApproval[tokenId];
    }

    function isApprovedForAll(
        address owner,
        address operator
    ) external view override returns (bool) {
        return _accountApproval[owner][operator];
    }

    function publish(
        string calldata newTitle
    ) external returns (uint256 tokenId) {
        uint256 newTokenId = _totalSupply;
        _totalSupply += 1;

        titles[newTokenId] = newTitle;
        _tokenOwner[newTokenId] = msg.sender;
        _balances[msg.sender] += 1;
        _tokenApproval[tokenId] = address(0);

        emit Publish(msg.sender, newTokenId, newTitle);

        return newTokenId;
    }

    function publishChapter(
        uint256 tokenId,
        uint64 chapterId,
        bytes calldata hash
    ) external {
        require(_tokenOwner[tokenId] == msg.sender
            || _accountApproval[_tokenOwner[tokenId]][msg.sender]
            || _tokenApproval[tokenId] == msg.sender, "You don't have acces to this token"); 

        chapterHash[tokenId][chapterId] = hash;
        chapterTimestamp[tokenId][chapterId] = block.timestamp;

        emit NewChapter(tokenId, chapterId, hash);
    }
}