import { Route, Router, Routes } from '@solidjs/router'
import Login from '../pages/Login'
import { Component } from 'solid-js'
import Register from '../pages/Register'

const Routers:Component =()=> <div>
     <Router>
<Routes>
  <Route path="/" component={Login} />
  <Route path="/register" component={Register} />
</Routes>
</Router>

</div>
export default Routers