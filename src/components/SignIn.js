import { auth, provider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';

export const SignIn = () => {

    const signIn = () => {
        signInWithPopup(auth, provider)
        .catch(error => {return})
    }

    return (<div id="signin">
        <h1>Sign In</h1>
        <button onClick={signIn}>Sign in With Google</button>
    </div>)
}