import { lazy, Suspense, useState } from 'react';
import { auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { MainContext } from '../contexts/MainContext';

const SignIn = lazy(() => import('./SignIn').then(module => ({default:module.SignIn})));
const Main = lazy(() => import('./Main').then(module => ({default:module.Main})));

function App() {

  const themes = {
    light: {
      backgroundColor1: '#fafafa',
      backgroundColor2: '#f2f2f2',
      backgroundColor3: '#284bbd',
      textColor: '#000'
    },
    dark: {
      backgroundColor1: '#212121',
      backgroundColor2: '#303030',
      backgroundColor3: '#1a1a1a',
      textColor: '#fff',
      textColor2: 'grey'
    }
  }

  const [user, loading] = useAuthState(auth);
  const [theme, setTheme] = useState(themes.light);

  return (
    <div className="App">
      <Suspense fallback={<div className='loading'><h1>Loading...</h1></div>}>
        <MainContext.Provider value={{
          user, theme, themes, setTheme
        }}>

          {loading ? <div className="loading"><h1>Checking...</h1></div> : 
          (user ? 
          <Main/>:
          <SignIn/>)}

        </MainContext.Provider>
      </Suspense>
    </div>
  );
}

export default App;
