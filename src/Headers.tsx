import React from "react";
import { Link } from "react-router-dom";

export default function Headers() {
    return <header>
        <h1>MKM</h1>
        <nav>
            <Link to="/">Home</Link>
            <Link to="/generate">Generate</Link>
            <Link to="/import">Import</Link>
            <Link to="/connect">Connect</Link>
        </nav>
    </header>
}