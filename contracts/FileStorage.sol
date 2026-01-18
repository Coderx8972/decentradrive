// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract FileStorage {
    // Enhanced Structs
    struct File {
        uint256 fileId;
        uint256 folderId;
        address uploader;
        string fileName;
        string ipfsHash;
        uint256 fileSize;
        uint256 timestamp;
        bool isPrivate;
        bool isDeleted;
        string encryptedKey;
        uint256 version;
        uint256 parentFileId;
        string mimeType;
        string thumbnailHash;
    }

    struct Folder {
        uint256 folderId;
        string folderName;
        uint256 parentFolderId;
        address owner;
        uint256 timestamp;
        bool isDeleted;
        bool isShared;
    }

    struct Comment {
        uint256 commentId;
        uint256 fileId;
        address commenter;
        string content;
        uint256 timestamp;
        uint256 parentCommentId;
        bool isDeleted;
    }

    struct AccessGrant {
        uint256 grantedAt;
        uint256 expiresAt;
        string encryptedKeyForUser;
        bool isRevoked;
    }

    struct Group {
        uint256 groupId;
        string groupName;
        address owner;
        address[] members;
        uint256 timestamp;
        bool isDeleted;
    }

    struct PasswordProtectedLink {
        string passwordHash;
        uint256 maxDownloads;
        uint256 downloadCount;
        uint256 expiresAt;
        bool isActive;
    }

    struct Annotation {
        uint256 annotationId;
        uint256 fileId;
        address author;
        string data;
        uint256 timestamp;
        bool isDeleted;
    }

    // State variables
    uint256 public nextFileId = 1;
    uint256 public nextFolderId = 1;
    uint256 public nextCommentId = 1;
    uint256 public nextGroupId = 1;
    uint256 public nextAnnotationId = 1;
    
    mapping(uint256 => File) public files;
    mapping(uint256 => Folder) public folders;
    mapping(uint256 => Comment) public comments;
    mapping(uint256 => Annotation) public annotations;
    mapping(uint256 => Group) public groups;
    
    mapping(uint256 => mapping(address => AccessGrant)) public accessGrants;
    mapping(uint256 => mapping(address => uint8)) public folderCollaborators;
    mapping(address => uint256[]) public userFiles;
    uint256[] public publicFiles;
    mapping(uint256 => uint256[]) public fileComments;
    mapping(uint256 => uint256[]) public fileAnnotations;
    mapping(uint256 => uint256[]) public folderFiles;
    mapping(uint256 => uint256[]) public folderSubfolders;
    mapping(address => uint256[]) public userGroups;
    mapping(uint256 => PasswordProtectedLink) public passwordLinks;
    
    // Events
    event FileUploaded(uint256 indexed fileId, address indexed uploader, bool isPrivate);
    event FolderCreated(uint256 indexed folderId, address indexed owner);
    event AccessGranted(uint256 indexed fileId, address indexed user, uint256 expiresAt);
    event AccessRevoked(uint256 indexed fileId, address indexed user);
    event FileDeleted(uint256 indexed fileId);
    event FileMoved(uint256 indexed fileId, uint256 indexed newFolderId);
    event CommentAdded(uint256 indexed commentId, uint256 indexed fileId, address indexed commenter);
    event FolderDeleted(uint256 indexed folderId);
    event GroupCreated(uint256 indexed groupId, address indexed owner);
    event AnnotationAdded(uint256 indexed annotationId, uint256 indexed fileId, address indexed author);

    // Modifiers
    modifier onlyOwnerOf(uint256 _fileId) {
        require(files[_fileId].uploader == msg.sender, "Not the file owner");
        require(!files[_fileId].isDeleted, "File is deleted");
        _;
    }

    modifier fileExists(uint256 _fileId) {
        require(_fileId > 0 && _fileId < nextFileId, "File does not exist");
        require(!files[_fileId].isDeleted, "File is deleted");
        _;
    }

    // Enhanced upload function
    function uploadFile(
        uint256 _folderId,
        string memory _fileName,
        string memory _ipfsHash,
        uint256 _fileSize,
        bool _isPrivate,
        string memory _encryptedKey,
        string memory _mimeType,
        string memory _thumbnailHash
    ) external returns (uint256) {
        if (_folderId != 0) {
            require(_folderId < nextFolderId, "Invalid folder ID");
            require(!folders[_folderId].isDeleted, "Folder is deleted");
            require(folders[_folderId].owner == msg.sender || folderCollaborators[_folderId][msg.sender] >= 2, "No access");
        }
        
        uint256 fileId = nextFileId++;
        files[fileId] = File({
            fileId: fileId,
            folderId: _folderId,
            uploader: msg.sender,
            fileName: _fileName,
            ipfsHash: _ipfsHash,
            fileSize: _fileSize,
            timestamp: block.timestamp,
            isPrivate: _isPrivate,
            isDeleted: false,
            encryptedKey: _encryptedKey,
            version: 1,
            parentFileId: 0,
            mimeType: _mimeType,
            thumbnailHash: _thumbnailHash
        });
        
        userFiles[msg.sender].push(fileId);
        if (!_isPrivate) publicFiles.push(fileId);
        if (_folderId != 0) folderFiles[_folderId].push(fileId);
        
        emit FileUploaded(fileId, msg.sender, _isPrivate);
        return fileId;
    }

    function createFolder(uint256 _parentFolderId, string memory _folderName, bool _isShared) external returns (uint256) {
        if (_parentFolderId != 0) {
            require(_parentFolderId < nextFolderId, "Invalid parent folder ID");
            require(!folders[_parentFolderId].isDeleted, "Parent folder is deleted");
            require(folders[_parentFolderId].owner == msg.sender || folderCollaborators[_parentFolderId][msg.sender] >= 2, "No access");
        }
        
        uint256 folderId = nextFolderId++;
        folders[folderId] = Folder({
            folderId: folderId,
            folderName: _folderName,
            parentFolderId: _parentFolderId,
            owner: msg.sender,
            timestamp: block.timestamp,
            isDeleted: false,
            isShared: _isShared
        });
        
        if (_parentFolderId != 0) folderSubfolders[_parentFolderId].push(folderId);
        emit FolderCreated(folderId, msg.sender);
        return folderId;
    }

    function grantAccess(uint256 _fileId, address _user, string memory _encryptedKey, uint256 _expiresAt) external onlyOwnerOf(_fileId) {
        require(files[_fileId].isPrivate, "File is not private");
        require(_user != address(0) && _user != msg.sender, "Invalid user");
        
        accessGrants[_fileId][_user] = AccessGrant({
            grantedAt: block.timestamp,
            expiresAt: _expiresAt,
            encryptedKeyForUser: _encryptedKey,
            isRevoked: false
        });
        
        emit AccessGranted(_fileId, _user, _expiresAt);
    }

    function revokeAccess(uint256 _fileId, address _user) external onlyOwnerOf(_fileId) {
        require(accessGrants[_fileId][_user].grantedAt > 0, "No access granted");
        accessGrants[_fileId][_user].isRevoked = true;
        emit AccessRevoked(_fileId, _user);
    }

    function deleteFile(uint256 _fileId) external onlyOwnerOf(_fileId) {
        files[_fileId].isDeleted = true;
        emit FileDeleted(_fileId);
    }

    function addComment(uint256 _fileId, string memory _content, uint256 _parentCommentId) external fileExists(_fileId) {
        if (_parentCommentId != 0) {
            require(_parentCommentId < nextCommentId, "Invalid parent comment");
            require(comments[_parentCommentId].fileId == _fileId, "Parent comment mismatch");
        }
        
        uint256 commentId = nextCommentId++;
        comments[commentId] = Comment({
            commentId: commentId,
            fileId: _fileId,
            commenter: msg.sender,
            content: _content,
            timestamp: block.timestamp,
            parentCommentId: _parentCommentId,
            isDeleted: false
        });
        
        fileComments[_fileId].push(commentId);
        emit CommentAdded(commentId, _fileId, msg.sender);
    }

    function deleteComment(uint256 _commentId) external {
        require(_commentId < nextCommentId, "Comment does not exist");
        require(comments[_commentId].commenter == msg.sender, "Not comment owner");
        comments[_commentId].isDeleted = true;
    }

    // Group functions
    function createGroup(string memory _groupName) external returns (uint256) {
        uint256 groupId = nextGroupId++;
        groups[groupId] = Group({
            groupId: groupId,
            groupName: _groupName,
            owner: msg.sender,
            members: new address[](0),
            timestamp: block.timestamp,
            isDeleted: false
        });
        
        userGroups[msg.sender].push(groupId);
        emit GroupCreated(groupId, msg.sender);
        return groupId;
    }

    function addGroupMember(uint256 _groupId, address _member) external {
        require(_groupId < nextGroupId, "Group does not exist");
        require(groups[_groupId].owner == msg.sender, "Not group owner");
        require(_member != address(0), "Invalid address");
        
        groups[_groupId].members.push(_member);
    }

    // Password link functions
    function createPasswordLink(uint256 _fileId, string memory _passwordHash, uint256 _maxDownloads, uint256 _expiresAt) external onlyOwnerOf(_fileId) {
        passwordLinks[_fileId] = PasswordProtectedLink({
            passwordHash: _passwordHash,
            maxDownloads: _maxDownloads,
            downloadCount: 0,
            expiresAt: _expiresAt,
            isActive: true
        });
    }

    function verifyPasswordAndDownload(uint256 _fileId, string memory _passwordHash) external returns (bool) {
        PasswordProtectedLink storage link = passwordLinks[_fileId];
        require(link.isActive, "Link inactive");
        require(keccak256(bytes(_passwordHash)) == keccak256(bytes(link.passwordHash)), "Invalid password");
        require(block.timestamp < link.expiresAt || link.expiresAt == 0, "Link expired");
        require(link.downloadCount < link.maxDownloads || link.maxDownloads == 0, "Download limit reached");
        
        link.downloadCount++;
        return true;
    }

    // Annotation functions
    function addAnnotation(uint256 _fileId, string memory _data) external fileExists(_fileId) {
        require(canAccess(_fileId), "No access to file");
        
        uint256 annotationId = nextAnnotationId++;
        annotations[annotationId] = Annotation({
            annotationId: annotationId,
            fileId: _fileId,
            author: msg.sender,
            data: _data,
            timestamp: block.timestamp,
            isDeleted: false
        });
        
        fileAnnotations[_fileId].push(annotationId);
        emit AnnotationAdded(annotationId, _fileId, msg.sender);
    }

    function addFolderCollaborator(uint256 _folderId, address _collaborator, uint8 _permission) external {
        require(_folderId < nextFolderId && folders[_folderId].owner == msg.sender, "Not folder owner");
        require(_collaborator != address(0) && _collaborator != msg.sender, "Invalid collaborator");
        require(_permission > 0 && _permission <= 3, "Invalid permission");
        
        folderCollaborators[_folderId][_collaborator] = _permission;
        folders[_folderId].isShared = true;
    }

    // View functions
    function getMyFiles() external view returns (File[] memory) {
        uint256[] memory fileIds = userFiles[msg.sender];
        File[] memory myFiles = new File[](fileIds.length);
        for (uint i = 0; i < fileIds.length; i++) {
            myFiles[i] = files[fileIds[i]];
        }
        return myFiles;
    }

    function getPublicFiles() external view returns (File[] memory) {
        File[] memory publicFilesArray = new File[](publicFiles.length);
        for (uint i = 0; i < publicFiles.length; i++) {
            publicFilesArray[i] = files[publicFiles[i]];
        }
        return publicFilesArray;
    }

    function getSharedWithMe() external view returns (File[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i < nextFileId; i++) {
            if (!files[i].isDeleted && files[i].isPrivate && canAccess(i) && files[i].uploader != msg.sender) {
                count++;
            }
        }
        
        File[] memory sharedFiles = new File[](count);
        uint256 index = 0;
        for (uint256 i = 1; i < nextFileId; i++) {
            if (!files[i].isDeleted && files[i].isPrivate && canAccess(i) && files[i].uploader != msg.sender) {
                sharedFiles[index] = files[i];
                index++;
            }
        }
        return sharedFiles;
    }

    function getFileComments(uint256 _fileId) external view returns (Comment[] memory) {
        require(_fileId > 0 && _fileId < nextFileId, "File does not exist");
        uint256[] memory commentIds = fileComments[_fileId];
        
        uint256 validCount = 0;
        for (uint i = 0; i < commentIds.length; i++) {
            if (!comments[commentIds[i]].isDeleted) validCount++;
        }
        
        Comment[] memory result = new Comment[](validCount);
        uint256 index = 0;
        for (uint i = 0; i < commentIds.length; i++) {
            if (!comments[commentIds[i]].isDeleted) {
                result[index] = comments[commentIds[i]];
                index++;
            }
        }
        return result;
    }

    function getFileAnnotations(uint256 _fileId) external view returns (Annotation[] memory) {
        require(_fileId > 0 && _fileId < nextFileId, "File does not exist");
        uint256[] memory annotationIds = fileAnnotations[_fileId];
        
        uint256 validCount = 0;
        for (uint i = 0; i < annotationIds.length; i++) {
            if (!annotations[annotationIds[i]].isDeleted) validCount++;
        }
        
        Annotation[] memory result = new Annotation[](validCount);
        uint256 index = 0;
        for (uint i = 0; i < annotationIds.length; i++) {
            if (!annotations[annotationIds[i]].isDeleted) {
                result[index] = annotations[annotationIds[i]];
                index++;
            }
        }
        return result;
    }

    function canAccess(uint256 _fileId) public view returns (bool) {
        if (_fileId == 0 || _fileId >= nextFileId || files[_fileId].isDeleted) return false;
        if (files[_fileId].uploader == msg.sender) return true;
        if (!files[_fileId].isPrivate) return true;
        
        AccessGrant memory grant = accessGrants[_fileId][msg.sender];
        if (grant.grantedAt == 0 || grant.isRevoked) return false;
        if (grant.expiresAt != 0 && block.timestamp > grant.expiresAt) return false;
        
        return true;
    }

    function getEncryptedKey(uint256 _fileId) external view returns (string memory) {
        require(canAccess(_fileId), "No access to file");
        if (files[_fileId].uploader == msg.sender) return files[_fileId].encryptedKey;
        return accessGrants[_fileId][msg.sender].encryptedKeyForUser;
    }
}
