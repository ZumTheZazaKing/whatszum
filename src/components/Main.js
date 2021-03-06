import { useState, useEffect, useContext, useRef, lazy, Suspense } from 'react';
import { MainContext } from '../contexts/MainContext';
import { auth, db, storage } from '../firebase';
import { uploadBytes, ref, getDownloadURL } from 'firebase/storage';
import { getDocs, getDoc, onSnapshot, doc, 
    setDoc, serverTimestamp, updateDoc, 
    collection, arrayUnion, arrayRemove, 
    query, limit, startAfter } from 'firebase/firestore';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SendIcon from '@mui/icons-material/Send';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import LogoutIcon from '@mui/icons-material/Logout';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DialogContentText from '@mui/material/DialogContentText';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import { toast } from 'react-toastify';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import uniqid from 'uniqid';
import '../styles/Main.css';
import '../styles/ChatInterface.css';

const User = lazy(() => import('./User').then(module => ({default:module.User})));
const Message = lazy(() => import('./Message').then(module => ({default:module.Message})));

export const Main = () => {

    const [userInfo, setUserInfo] = useState({});
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedMessageId, setSelectedMessageId] = useState(null);
    const [selectedMessageText, setSelectedMessageText] = useState('');
    const [chatMessages, setChatMessages] = useState([]);
    const [editProfileImage, setEditProfileImage] = useState("");
    const [viewOlderMsg, setViewOlderMsg] = useState(true);
    const [showLoadUsers, setShowLoadUsers] = useState(true);
    const { theme, themes, setTheme } = useContext(MainContext);
    const dummy = useRef();
    const topDummy = useRef();
    const sidebarDisplay = useRef();

    useEffect(() => {
        let userDoc = doc(db,"users",auth.currentUser.uid);
        

        //Get user data
        onSnapshot(userDoc, snapshot => {
            if(!snapshot.exists()){
                handleNewUser(userDoc);
                return setUserInfo(snapshot.data());
            }
            setUserInfo(snapshot.data());
            setEditProfileImage(snapshot.data().avatar);
            setTheme(snapshot.data().isDark ? themes.dark : themes.light);
        })

        //Get list of users limited to 10, exclude the user themselves
        loadUsers();
       
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[]);

    const loadUsers = async () => {
        let usersDoc = query(collection(db,"users"), limit(10));
        await getDocs(usersDoc).then(snapshot => {
            setUsers(snapshot.docs.filter(d => d.id !== auth.currentUser.uid));
        })
    }


    const loadMoreUsers = async () => {
        const nextBatchUsers = query(collection(db,"users"), limit(10), startAfter(users[users.length - 1]));
        await getDocs(nextBatchUsers).then(snapshot => {
            if(snapshot.size > 0 && snapshot.docs[0].id !== auth.currentUser.uid){
                setUsers(users.concat(snapshot.docs.filter(d => d.id !== auth.currentUser.uid)));
            } else {
                setShowLoadUsers(false);
                
            }
        })
    }

    //Auto scroll to new messages
    useEffect(() => {
        dummy.current.scrollIntoView({behavior: 'smooth'});
    });

    const handleNewUser = async userDoc => {
        const userPayload = {
            name: auth.currentUser.displayName,
            avatar: auth.currentUser.photoURL,
            description:"No description yet",
            joinedAt:serverTimestamp(),
            isDark:false
        }
        await setDoc(userDoc, userPayload);
    }

    const signOut = () => {
        menuHandleClose();
        auth.signOut()
        .catch(error => {return})
    }
    const switchTheme = async () => {
        menuHandleClose();
        await updateDoc(doc(db,"users",auth.currentUser.uid), {isDark:!userInfo.isDark});
    }

    const [menuAnchorEl, setMenuAnchorEl] = useState(null);
    const menuOpen = Boolean(menuAnchorEl);
    const menuHandleClick = (event) => {
        setMenuAnchorEl(event.currentTarget);
    };
    const menuHandleClose = () => {
        setMenuAnchorEl(null);
    };

    const handleUserClick = e => {
        const ref1 = `${auth.currentUser.uid}[AND]${e.currentTarget.id}`;
        const ref2 = `${e.currentTarget.id}[AND]${auth.currentUser.uid}`;

        if(window.innerWidth < 600){
            sidebarDisplay.current.style.display = "none";
        }

        onSnapshot(doc(db,"users",e.currentTarget.id), snapshot => {
            setSelectedUser({...snapshot.data(), id:snapshot.id});
        })

        onSnapshot(doc(db,"chats",ref1), async snapshot1 => {
            if(snapshot1.exists()){
                setChatMessages([...snapshot1.data().messages.slice(-20, )])
            } else { 
                onSnapshot(doc(db,"chats",ref2), snapshot2 => {
                    if(snapshot2.exists()){
                        return setChatMessages([...snapshot2.data().messages.slice(-20, )]);
                    } else {
                        setDoc(doc(db,"chats",ref1), {messages:[]});
                        setChatMessages([]);
                    }
                    
                })
            }   
        })
    }

    const [editOpen, setEditOpen] = useState(false);
    const handleEditOpen = () => {
        setEditOpen(true);
        menuHandleClose();
    };
    const handleEditClose = () => {
        setEditOpen(false);
        setEditProfileImage(userInfo.avatar);
    };

    //function to upload image to use for editing profile
    const imageUpload = async(e) => {
        if(!e.target.files[0])return;

        const storageRef = ref(storage,`/${auth.currentUser.uid}Images/${e.target.files[0].name}`);

        await uploadBytes(storageRef, e.target.files[0])
        .catch(() => toast.error("Unable to retrieve image"));

        await getDownloadURL(ref(storage,`/${auth.currentUser.uid}Images/${e.target.files[0].name}`))
        .then(url => {setEditProfileImage(url);})
        .catch(() => toast.error("Unable to get image reference"));
    }

    //Function to edit profile
    const editProfile = async e => {
        e.preventDefault();
        if(!e.target.username.value)return toast.error("Please enter a username");

        await updateDoc(doc(db,"users",auth.currentUser.uid), {
            name:e.target.username.value,
            avatar:editProfileImage,
            description:e.target.description.value || "No description yet"
        }).then(() => {toast.success("Profile updated successfully")})
        .catch(() => {toast.error("Profile update failed")});

        handleEditClose();
    }

    //Function to send message
    const handleSendMessage = e => {
        e.preventDefault();

        if(!e.target.message.value)return toast.error("Message cannot be empty");
        const currentTime = new Date().toUTCString();

        const ref1 = `${auth.currentUser.uid}[AND]${selectedUser.id}`;
        const ref2 = `${selectedUser.id}[AND]${auth.currentUser.uid}`;

        getDoc(doc(db,"chats",ref1))
        .then(snapshot => {
            if(snapshot.exists()){
                updateDoc(doc(db,"chats",ref1), {messages:arrayUnion({
                    body: e.target.message.value,
                    sentAt: currentTime,
                    sender: auth.currentUser.uid,
                    id:uniqid()
                })}).then(() => {e.target.message.value = "";dummy.current.scrollIntoView({behavior: 'smooth'});})
                .catch(err => console.log("Error sending message", err));
            } else {
                updateDoc(doc(db,"chats",ref2), {messages:arrayUnion({
                    body: e.target.message.value,
                    sentAt: currentTime,
                    sender: auth.currentUser.uid,
                    id:uniqid()
                })}).then(() => {e.target.message.value = "";dummy.current.scrollIntoView({behavior: 'smooth'});})
                .catch(err => console.log("Error sending message", err));
            }
        }).catch(err => console.log("Error sending message"));
    }

    //Function to handle context menu
    const [contextMenu, setContextMenu] = useState(null);
    const openContextMenu = (e) => {

        if(!e.target.parentNode.id)return;
        setSelectedMessageId(e.target.parentNode.id);
        const spanIndex = e.target.innerHTML.indexOf("<span>");
        setSelectedMessageText(e.target.innerHTML.substr(0,spanIndex));

        e.preventDefault();
        setContextMenu(
            contextMenu === null
            ? {
                mouseX: e.clientX - 2,
                mouseY: e.clientY - 4,
            }
            : null,
        );
    };
    const handleContextClose = () => {
        setContextMenu(null);
    };


    //Delete popup and delete function
    const [deleteOpen, setDeleteOpen] = useState(false);
    const handleDeleteOpen = () => {
        setDeleteOpen(true);
        handleContextClose();
    };
    const handleDeleteClose = () => {
        setDeleteOpen(false);
    };
    const handleDeleteYes = (e) => {
        handleDeleteClose();

        const ref1 = `${auth.currentUser.uid}[AND]${selectedUser.id}`;
        const ref2 = `${selectedUser.id}[AND]${auth.currentUser.uid}`;
        
        const [victimObject] = chatMessages.filter(message => message.id === selectedMessageId);
        onSnapshot(doc(db,"chats",ref1), snapshot1 => {
            if(snapshot1.exists()){
                updateDoc(doc(db,"chats",ref1), {messages:arrayRemove(victimObject)})
                .then(() => {toast.success("Message deleted successfully")})
                .catch(() => {toast.error("Message deletion failed")});
            } else {
                updateDoc(doc(db,"chats",ref2), {messages:arrayRemove(victimObject)})
                .then(() => {toast.success("Message deleted successfully")})
                .catch(() => {toast.error("Message deletion failed")});
            }
        })

    }

    //Function to handle search
    const search = async e => {
        e.preventDefault();
        setShowLoadUsers(undefined)

        if(!e.target.searchQuery.value){
            await getDocs(query(collection(db,"users"),limit(10)))
            .then(snapshot => {
                setUsers(snapshot.docs.filter(d => d.id !== auth.currentUser.uid));
            })
            setShowLoadUsers(true);
            return;
        }

        onSnapshot(collection(db,"users"), snapshot => {
            setUsers(snapshot.docs.filter(d => 
                d.data().name.toLowerCase().includes(e.target.searchQuery.value.toLowerCase()) 
                && d.id !== auth.currentUser.uid
            ));
        })
    }

    //Function to view older messages
    const viewOlderMessages = () => {
        const ref1 = `${auth.currentUser.uid}[AND]${selectedUser.id}`;
        const ref2 = `${selectedUser.id}[AND]${auth.currentUser.uid}`;

        setTimeout(() => {topDummy.current.scrollIntoView({behavior: 'smooth'})}, 100);

        getDoc(doc(db,"chats",ref1))
        .then(snapshot1 => {
            if(snapshot1.exists()){
                const indexForExpansion = snapshot1.data().messages.findIndex(message => message.id === chatMessages[0].id);
                const hiddenMessages = snapshot1.data().messages.slice(0,indexForExpansion);
                let messagesToAdd;

                if(hiddenMessages.length >= 20){
                    messagesToAdd = snapshot1.data().messages.slice(indexForExpansion-20, indexForExpansion)
                } else {
                    messagesToAdd = snapshot1.data().messages.slice(indexForExpansion-hiddenMessages.length, indexForExpansion)
                }
                if(messagesToAdd.length === 0)return setViewOlderMsg(false);
                setChatMessages([...messagesToAdd, ...chatMessages]);
            } else {
                getDoc(doc(db,"chats",ref2))
                .then(snapshot2 => {
                    const indexForExpansion = snapshot2.data().messages.findIndex(message => message.id === chatMessages[0].id);
                    const hiddenMessages = snapshot2.data().messages.slice(0,indexForExpansion);
                    let messagesToAdd;

                    if(hiddenMessages.length >= 20){
                        messagesToAdd = snapshot2.data().messages.slice(indexForExpansion-20, indexForExpansion)
                    } else {
                        messagesToAdd = snapshot2.data().messages.slice(indexForExpansion-hiddenMessages.length, indexForExpansion)
                    }
                    if(messagesToAdd.length === 0)return setViewOlderMsg(false);
                    setChatMessages([...messagesToAdd, ...chatMessages]);
                })
            }
        })

    }



    return (<div id="main" style={{backgroundColor:theme.backgroundColor2}}>
        <div ref={sidebarDisplay} id="main-sidebar" style={{backgroundColor:theme.backgroundColor1}}>
            <div id='main-topbar' style={{backgroundColor:theme.backgroundColor3}}>
                <Avatar src={userInfo ? userInfo.avatar : ""} alt={userInfo ? userInfo.name : ""}/>
                <IconButton onClick={menuHandleClick}>
                    <MoreVertIcon sx={{color:"white"}} />
                </IconButton>
            </div>
            <Menu
                id="basic-menu"
                anchorEl={menuAnchorEl}
                open={menuOpen}
                onClose={menuHandleClose}
                MenuListProps={{
                    'aria-labelledby': 'basic-button',
                }}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
            >
                <MenuItem onClick={handleEditOpen}>
                    <ListItemIcon>
                        <AccountBoxIcon fontSize="small"/>
                    </ListItemIcon>
                    Edit Profile
                </MenuItem>
                <MenuItem onClick={switchTheme}>
                    <ListItemIcon>
                        {userInfo ? (userInfo.isDark ? <LightModeIcon fontSize="small"/> : <DarkModeIcon fontSize="small"/>) : ""}
                    </ListItemIcon>
                    {userInfo ? (userInfo.isDark ? "Light Mode" : "Dark Mode") : ""}
                </MenuItem>
                <MenuItem onClick={signOut}>
                    <ListItemIcon><LogoutIcon fontSize="small"/></ListItemIcon>
                    Logout
                </MenuItem>
            </Menu>

            <Dialog open={editOpen} onClose={handleEditClose}>
                <DialogTitle>Edit Profile</DialogTitle>
                <form onSubmit={editProfile}>
                    <DialogContent sx={{
                        display:"flex", 
                        flexDirection:"column",
                        alignItems:"center",
                        justifyContent:"center"}}
                    >
                        <TextField name='image' 
                            type="file" 
                            id="editImageInput" 
                            sx={{display:"none"}}
                            accept="image/*"
                            onChange={e => imageUpload(e)}
                        />
                        <label htmlFor='editImageInput'>
                            <Avatar
                                sx={{width:50, height:50}}
                                src={editProfileImage} 
                                alt="Z"
                            />
                        </label>
                        <br/>
                        <TextField
                            margin="dense"
                            id="name"
                            label="Username"
                            type="text"
                            fullWidth
                            variant="standard"
                            name='username'
                            defaultValue={userInfo ? userInfo.name : ""}
                            inputProps={{maxLength:20}}
                            autoComplete='off'
                        />
                        <TextField
                            margin="dense"
                            id="name"
                            label="Description"
                            type="text"
                            fullWidth
                            variant="standard"
                            name='description'
                            defaultValue={userInfo ? userInfo.description : ""}
                            inputProps={{maxLength:100}}
                            autoComplete='off'
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleEditClose}>Cancel</Button>
                        <Button type="submit" variant='contained'>Edit</Button>
                    </DialogActions>
                </form>
            </Dialog>
            <Menu
                open={contextMenu !== null}
                onClose={handleContextClose}
                anchorReference="anchorPosition"
                anchorPosition={
                    contextMenu !== null
                    ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
                    : undefined
                }
                anchorOrigin={{
                    vertical: 'center',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
            >
                <CopyToClipboard text={selectedMessageText} onCopy={() => toast.success("Message copied")}>
                    <MenuItem onClick={handleContextClose}>
                        <ListItemIcon><ContentCopyIcon/></ListItemIcon>
                        Copy
                    </MenuItem>
                </CopyToClipboard>
                <MenuItem sx={{color:"crimson"}} onClick={handleDeleteOpen}>
                    <ListItemIcon><DeleteIcon sx={{color:"crimson"}}/></ListItemIcon>
                    Delete
                </MenuItem>
            </Menu>


            <div id="main-chats">
                <Suspense fallback={<div style={{color:theme.textColor}}><h3>Loading...</h3></div>}>
                    <form onSubmit={e => search(e)}>
                        <TextField
                            margin="dense"
                            type="text"
                            fullWidth
                            variant="standard"
                            name='searchQuery'
                            inputProps={{maxLength:20}}
                            autoComplete='off'
                            sx={{input:{color:theme.textColor, padding:"10px"}}}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <IconButton type="submit">
                                            <SearchIcon sx={{color:theme.textColor}} />
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />
                    </form>
                    {users.length ? users && users.map((user,i) => {
                        return (
                        <User handleUserClick={handleUserClick} 
                            key={i} id={user.id} 
                            info={user.data()}/>
                        )
                    }) : <div id="no-results"><h3 style={{color:theme.textColor}}>??\_(???)_/??</h3></div>}
                    
                    <div id="load-users">
                    {users.length && showLoadUsers !== undefined ? 
                        (showLoadUsers ? 
                            <Button onClick={loadMoreUsers}>More</Button>
                        : <h5 style={{color:theme.textColor, padding:"10px"}}>NO MORE USERS</h5>) 
                    : ""}
                    </div>
                </Suspense>
            </div>

        </div>

        <div id="main-chat-interface">
            <div id="main-chat-interface-header" style={{backgroundColor:theme.backgroundColor1}}>
                {window.innerWidth < 600 ? 
                <IconButton onClick={() => sidebarDisplay.current.style.display = "block"}>
                    <ArrowBackIosNewIcon sx={{color:theme.textColor}}/>
                </IconButton> 
                : ""}
                { selectedUser ? 
                <div id="main-chat-interface-header-content">
                    <Avatar src={selectedUser.avatar} alt={selectedUser.name}/>
                    <p style={{color:theme.textColor}}>{selectedUser.name}</p>
                </div>
                : ""}
            </div>


            <div className="main-chat-interface-body">
                <div ref={topDummy}></div>
                {chatMessages.length ? (
                viewOlderMsg ? 
                <Button onClick={() => viewOlderMessages()}>View Older Messages</Button> 
                : <h3 style={{color:theme.textColor}}>Beginning of conversation reached</h3>) 
                : ""}
                <Suspense fallback={<div style={{color:theme.textColor}}><h3>Loading...</h3></div>}>
                    {chatMessages ? (chatMessages.length ? chatMessages.map((message,i) => {
                        return <Message openContextMenu={openContextMenu} isDark={userInfo.isDark} key={i} info={message}/>
                    }) 
                    : <div className="loading chats" style={{backgroundColor:theme.backgroundColor2, color:theme.textColor}}>Start a conversation</div>)
                    : <div className="loading chats" style={{backgroundColor:theme.backgroundColor2, color:theme.textColor}}>Select a user to chat with</div>}
                </Suspense>
                <div ref={dummy}></div>
            </div>
            <Dialog
                open={deleteOpen}
                onClose={handleDeleteClose}
            >
                <DialogTitle>
                    Are you sure?
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Message will be deleted permanently for all users.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteClose}>No</Button>
                    <Button variant="contained" onClick={handleDeleteYes} autoFocus>
                        Yes
                    </Button>
                </DialogActions>
            </Dialog>

            {selectedUser ? 
            <div id="main-chat-interface-footer" style={{backgroundColor:theme.backgroundColor3}}>
                <form onSubmit={e => handleSendMessage(e)}>
                    <input autoComplete='off' maxLength={700} name="message" id="main-chat-interface-input" type="text"/>
                    <IconButton type='submit' id="main-chat-interface-send">
                        <SendIcon fontSize="large" sx={{color:"white"}}/>
                    </IconButton>
                </form>
            </div>
            : ""}
        </div>

    </div>)
}