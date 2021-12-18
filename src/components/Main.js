import { useState, useEffect, useContext, useRef, lazy, Suspense } from 'react';
import { MainContext } from '../contexts/MainContext';
import { auth, db } from '../firebase';
import { onSnapshot, doc, setDoc, serverTimestamp, updateDoc, collection, arrayUnion } from 'firebase/firestore';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SendIcon from '@mui/icons-material/Send';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import LogoutIcon from '@mui/icons-material/Logout';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { toast } from 'react-toastify';
import '../styles/Main.css';
import '../styles/ChatInterface.css';

const User = lazy(() => import('./User').then(module => ({default:module.User})));
const Message = lazy(() => import('./Message').then(module => ({default:module.Message})));

export const Main = () => {

    const [userInfo, setUserInfo] = useState({});
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const { theme, themes, setTheme } = useContext(MainContext);
    const dummy = useRef();

    useEffect(() => {
        let userDoc = doc(db,"users",auth.currentUser.uid);
        let usersDoc = collection(db,"users");
        onSnapshot(userDoc, snapshot => {
            if(!snapshot.exists()){
                handleNewUser(userDoc);
            }
            setUserInfo(snapshot.data());
            setTheme(snapshot.data().isDark ? themes.dark : themes.light);
        })
        onSnapshot(usersDoc, snapshot => {
            setUsers(snapshot.docs.filter(d => d.id !== auth.currentUser.uid));
        })
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[]);

    //Auto scroll to new messages
    useEffect(() => {
        dummy.current.scrollIntoView({behavior: 'smooth'});
    })

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

        onSnapshot(doc(db,"users",e.currentTarget.id), snapshot => {
            setSelectedUser({...snapshot.data(), id:snapshot.id});
        })

        onSnapshot(doc(db,"chats",ref1), async snapshot1 => {
            if(snapshot1.exists()){
                setChatMessages([...snapshot1.data().messages])
            } else { 
                onSnapshot(doc(db,"chats",ref2), snapshot2 => {
                    if(snapshot2.exists()){
                        return setChatMessages([...snapshot2.data().messages]);
                    } else {
                        console.log("Conversation not started");
                        setDoc(doc(db,"chats",ref1), {messages:[]});
                        setChatMessages([]);
                    }
                    
                })
            }   
        })
    }

    const handleSendMessage = e => {
        e.preventDefault();

        if(!e.target.message.value)return toast.error("Message cannot be empty");
        const currentTime = new Date().toUTCString();

        const ref1 = `${auth.currentUser.uid}[AND]${selectedUser.id}`;
        const ref2 = `${selectedUser.id}[AND]${auth.currentUser.uid}`;

        updateDoc(doc(db,"chats",ref1), {messages:arrayUnion({
            body: e.target.message.value,
            sentAt: currentTime,
            sender: auth.currentUser.uid
        })}).then(() => {e.target.message.value = "";dummy.current.scrollIntoView({behavior: 'smooth'});})
        .catch(error => {
            updateDoc(doc(db,"chats",ref2), {messages:arrayUnion({
                body: e.target.message.value,
                sentAt: currentTime,
                sender: auth.currentUser.uid
            })}).then(() => {e.target.message.value = "";dummy.current.scrollIntoView({behavior: 'smooth'});})
            .catch(err => console.log("Error sending message", err));

        })
    }

    return (<div id="main" style={{backgroundColor:theme.backgroundColor2}}>
        <div id="main-sidebar" style={{backgroundColor:theme.backgroundColor1}}>
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


            <div id="main-chats">
                <Suspense fallback={<div>Loading...</div>}>
                    {users.length ? users && users.map((user,i) => {
                        return (
                        <User handleUserClick={handleUserClick} 
                            key={i} id={user.id} 
                            info={user.data()}/>
                        )
                    }) : ""}
                </Suspense>
            </div>

        </div>

        <div id="main-chat-interface">
            <div id="main-chat-interface-header" style={{backgroundColor:theme.backgroundColor1}}>
                { selectedUser ? 
                <div id="main-chat-interface-header-content">
                    <Avatar src={selectedUser.avatar} alt={selectedUser.name}/>
                    <p style={{color:theme.textColor}}>{selectedUser.name}</p>
                </div>
                : ""}
            </div>

            <div id="main-chat-interface-body">
                <Suspense fallback={<div>Loading...</div>}>
                    {chatMessages ? (chatMessages.length ? chatMessages.map((message,i) => {
                        return <Message isDark={userInfo.isDark} key={i} info={message}/>
                    }) 
                    : <div className="loading chats" style={{backgroundColor:theme.backgroundColor2, color:theme.textColor}}>Start a conversation</div>)
                    : <div className="loading chats" style={{backgroundColor:theme.backgroundColor2, color:theme.textColor}}>Select a user to chat with</div>}
                </Suspense>
                <div ref={dummy}></div>
            </div>

            {selectedUser ? 
            <div id="main-chat-interface-footer" style={{backgroundColor:theme.backgroundColor3}}>
                <form onSubmit={e => handleSendMessage(e)}>
                    <input autoComplete='off' maxLength={700} name="message" id="main-chat-interface-input" type="text"/>
                    <IconButton type='submit' id="main-chat-interface-send">
                        <SendIcon sx={{color:"white"}} fontSize="large"/>
                    </IconButton>
                </form>
            </div>
            : ""}
        </div>

    </div>)
}