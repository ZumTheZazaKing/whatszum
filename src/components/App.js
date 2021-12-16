import { lazy, Suspense } from 'react';
import { auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { MainContext } from '../contexts/MainContext';

const SignIn = lazy(() => import('./SignIn').then(module => ({default:module.SignIn})));
const Main = lazy(() => import('./Main').then(module => ({default:module.Main})));

function App() {

  const [user, loading] = useAuthState(auth);

  return (
    <div className="App">
      <Suspense fallback={<div className='loading'><h1>Loading...</h1></div>}>
        <MainContext.Provider value={{
          user
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
