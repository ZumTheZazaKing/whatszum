import { auth, provider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import Button from '@mui/material/Button';
import GoogleIcon from '@mui/icons-material/Google';
import '../styles/SignIn.css';

export const SignIn = () => {

    const signIn = () => {
        signInWithPopup(auth, provider)
        .catch(error => {return})
    }

    return (<div id="signin">
        <div id="signin-topbar">
            <h2>WhatsZum</h2>
        </div>
        <div id="signin-content">
            <p>Sign in to start chatting</p>
            <br/>
            <Button 
            variant='contained' 
            startIcon={<GoogleIcon/>} 
            onClick={signIn}
            >Sign in</Button>
        </div>
    </div>)
}