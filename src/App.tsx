import React from "react"
import { Route } from "react-router-dom"
import * as home from "./Home"
import * as generate from "./Generate"
import * as Import from "./Import"
import * as edit from "./Edit"
import * as connect from "./Connect"
import * as session from "./Session"
import { createBrowserRouter } from "react-router-dom"
import { createRoutesFromElements } from "react-router-dom"
import { Outlet } from "react-router-dom"
import { RouterProvider } from "react-router-dom"
import { useReducer } from "react"
import { ContextProps, initState, reducer } from "./state"
import { createContext } from "react"

const router = createBrowserRouter(
    createRoutesFromElements(
        <Route path="/" element={<Outlet />}>
            <Route path="/" element={<home.Element />} />
            <Route path="/generate" element={<generate.Element />} />
            <Route path="/import" element={<Import.Element />} />
            <Route path="/edit/:id" element={<edit.Element />} />
            <Route path="/connect" element={<connect.Element />} />
            <Route path="/connect/:id" element={<session.Element />} />
        </Route>
    )
)

export const ctx = createContext<ContextProps>({ state: initState, dispatch: () => initState })

export default function App() {
    const [state, dispatch] = useReducer(reducer, initState)
    return <ctx.Provider value={{ state, dispatch }}>
        <RouterProvider router={router} />
    </ctx.Provider>
}
