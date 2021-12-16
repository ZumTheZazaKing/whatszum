import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onSnapshot, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import LogoutIcon from '@mui/icons-material/Logout';
import '../styles/Main.css';

export const Main = () => {

    const [userInfo, setUserInfo] = useState({});

    useEffect(() => {
        let userDoc = doc(db,"users",auth.currentUser.uid);
        onSnapshot(userDoc, snapshot => {
            if(!snapshot.exists()){
                handleNewUser(userDoc);
            }
            setUserInfo(snapshot.data());
        })
    },[]);

    const handleNewUser = async userDoc => {
        const userPayload = {
            name: auth.currentUser.displayName,
            avatar: auth.currentUser.photoURL,
            description:"No description yet",
            joinedAt:serverTimestamp()
        }
        await setDoc(userDoc, userPayload);
    }

    const signOut = () => {
        menuHandleClose();
        auth.signOut()
        .catch(error => {return})
    }

    const [menuAnchorEl, setMenuAnchorEl] = useState(null);
    const menuOpen = Boolean(menuAnchorEl);
    const menuHandleClick = (event) => {
        setMenuAnchorEl(event.currentTarget);
    };
    const menuHandleClose = () => {
        setMenuAnchorEl(null);
    };

    return (<div id="main">
        <div id="main-sidebar">
            <div id='main-topbar'>
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
                <MenuItem onClick={signOut}>
                    <ListItemIcon><LogoutIcon fontSize="small"/></ListItemIcon>
                    Logout
                </MenuItem>
            </Menu>


            <div id="main-chats"></div>

        </div>


        <div id="main-chat-interface"></div>

    </div>)
}