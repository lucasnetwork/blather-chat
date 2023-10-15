import { Route, Router, Routes } from "@solidjs/router";
import Login from "../pages/Login";
import { Component } from "solid-js";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";

const Routers: Component = () => (
  <Router>
    <Routes>
      <Route path="/" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/dashboard" component={Dashboard} />
    </Routes>
  </Router>
);

export default Routers;
