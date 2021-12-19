import { useContext } from 'react';
import { MainContext } from '../contexts/MainContext';
import { auth } from '../firebase';
import moment from 'moment';

export const Message = (props) => {

    const { body, sender, sentAt, id } = props.info;
    const { theme } = useContext(MainContext);

    return <div
    id={id}
    className={`message ${sender === auth.currentUser.uid ? 'sent' : ''}`}
    onContextMenu={auth.currentUser.uid === sender ? props.openContextMenu : () => {return}}
    style={sender === auth.currentUser.uid ? {} : {backgroundColor:theme.backgroundColor1, color:theme.textColor}}>
        <p>
            {body}
            <span style={!props.isDark && sender !== auth.currentUser.uid ? {color:"black"} : {}}>
                {`${moment(sentAt).hours()}:${moment(sentAt).minutes() < 10 ? '0' + moment(sentAt).minutes() : moment(sentAt).minutes()}`}
            </span>
        </p>
        
    </div>
}