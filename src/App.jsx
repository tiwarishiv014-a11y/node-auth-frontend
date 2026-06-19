import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Register     from './pages/Register';
import Login        from './pages/Login';
import Dashboard    from './pages/Dashboard';
import Profile      from './pages/Profile';           // ← ADD
import Chat         from './pages/Chat';
import PdfChat      from './pages/PdfChat';
import PrivateRoute from './components/PrivateRoute';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/"          element={<Login />} />
                <Route path="/login"     element={<Login />} />
                <Route path="/register"  element={<Register />} />

                <Route path="/profile" element={        // ← ADD
                    <PrivateRoute>
                        <Profile />
                    </PrivateRoute>
                } />


                <Route path="/dashboard" element={
                    <PrivateRoute role="admin">
                        <Dashboard />
                    </PrivateRoute>
                } />
               <Route path="/chat" element={
                    <PrivateRoute>
                        <Chat />
                    </PrivateRoute>
                } />
               <Route path="/pdf-chat" element={
                    <PrivateRoute>
                        <PdfChat />
                    </PrivateRoute>
                } />
            </Routes>
        </Router>
    );
}

export default App;


// function App2(){
//   const[name,setName] = useState('shivansh');
//   const[phone,setPhone] = useState('8754786');
//   const[status,setStatus] = useState('pending');
//   const[submitted,setSubmitted] = useState(false);

//   const handleSubmit= (e) => {
//     if(name && phone && status){
//       setSubmitted(true);
//     }else{      alert('Please fill all fields');}
//   };
//   return(
//     <>
//       <div>
//       <h1>{name}</h1>
//        <button onClick={() => setName('Rahul')}>Change Name</button>
//       <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="enter your name" />
//       <button onClick={() => setName('')} >clear name</button>
//       <button onClick={() => setName('Shivansh')}>Reset Name</button>
//       </div>
//       <div>
//         <h1>{phone}</h1>

//       <input type="text"  value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="enter your phone" />
//       <button onClick={() => setPhone('')}> clear phone</button>
//       <button onClick={() => setPhone('8754786')}>Reset phone</button>
//       </div>
//       <div>
//         <h1>{status}</h1>
//       <input type="text"  value={status} onChange={(e) => setStatus(e.target.value)} placeholder="enter your status" />
//       <button onClick = {() => setStatus('')}>Clear Status</button>
//       <button onClick = {() => setStatus('pending')}>Reset Status</button>
      
//       </div>
//       <button onClick ={handleSubmit}>submit</button>
//       {submitted && (
//         <div>
//           <h2>Name: {name}</h2>
//           <h2>Phone: {phone}</h2>
//           <h2>Status: {status}</h2>
//         </div>  
//       )}
//     </>
//   );
// }
// export default App2;