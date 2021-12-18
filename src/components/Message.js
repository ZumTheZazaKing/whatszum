import { useContext } from 'react';
import { MainContext } from '../contexts/MainContext';
import { auth } from '../firebase';
import moment from 'moment';

export const Message = (props) => {

    const { body, sender, sentAt } = props.info;
    const { theme } = useContext(MainContext);

    return <div className={`message ${sender === auth.currentUser.uid ? 'sent' : ''}`}
    style={sender === auth.currentUser.uid ? {} : {backgroundColor:theme.backgroundColor1, color:theme.textColor}}>
        <p>
            {body}
            <span style={!props.isDark && sender !== auth.currentUser.uid ? {color:"black"} : {}}>
                {`${moment(sentAt).hours()}:${moment(sentAt).minutes()}`}
            </span>
        </p>
        
    </div>
}