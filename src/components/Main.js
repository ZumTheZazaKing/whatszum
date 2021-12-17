import { useState, useEffect, useContext, lazy, Suspense } from 'react';
import { MainContext } from '../contexts/MainContext';
import { auth, db } from '../firebase';
import { onSnapshot, doc, setDoc, serverTimestamp, updateDoc, collection } from 'firebase/firestore';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import LogoutIcon from '@mui/icons-material/Logout';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import '../styles/Main.css';

const User = lazy(() => import('./User').then(module => ({default:module.User})));

export const Main = () => {

    const [userInfo, setUserInfo] = useState({});
    const [users, setUsers] = useState([]);
    const { theme, themes, setTheme } = useContext(MainContext);

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
                    {users.length ? users && users.map(user => {
                        return (<User key={user.id} info={user.data()}/>)
                    }) : ""}
                </Suspense>
            </div>

        </div>


        <div id="main-chat-interface"></div>

    </div>)
}