import { useContext } from 'react';
import { MainContext } from '../contexts/MainContext';
import Avatar from '@mui/material/Avatar';
import '../styles/User.css';

export const User = (props) => {

    const { avatar, name } = props.info;
    const { theme } = useContext(MainContext);

    return (<div className="user">
        <div className="user-avatar">
            <Avatar src={avatar} alt={name}/>
        </div>
        <div className="user-name" style={{color:theme.textColor}}>
                {name}
        </div>
    </div>)
}