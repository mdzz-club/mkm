import React from "react"
import localforage from "localforage"
import Headers from "./Headers"
import Footer from "./Footer"
import { loadProfile, shortKey } from "./mkm"
import { useEffect } from "react"
import { Link } from "react-router-dom"
import { ctx } from "./App"
import { useContext } from "react"

export function Element() {
	const { state, dispatch } = useContext(ctx)
	useEffect(() => {
		localforage.getItem("keys").then((keys) => {
			dispatch({ type: "setKeys", payload: keys || [] })
		})
		state.keys.forEach(id => {
			loadProfile(id, p => {
				p && dispatch({ type: "updateProfile", payload: { id, data: p } })
			})
		})
	}, [])
	const name = (id: string) => {
		const p = state.profiles[id]
		return p ? p.display_name || p.name || shortKey(id) : shortKey(id)
	}
	return <>
		<Headers />

		<h2>Your keys:</h2>

		<ul>
			{state.keys.map(i => <li key={i}><Link to={"/edit/" + i}>{name(i)}</Link></li>)}
		</ul>

		<Footer />
	</>
}

export async function loader() {
	return (await localforage.getItem("keys") || []) as string[]
}
