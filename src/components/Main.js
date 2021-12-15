import { auth } from '../firebase';

export const Main = () => {

    const signOut = () => {
        auth.signOut()
        .catch(error => {return})
    }

    return (<div id="main">
        <h1>Main</h1>
        <button onClick={signOut}>Sign Out</button>
    </div>)
}