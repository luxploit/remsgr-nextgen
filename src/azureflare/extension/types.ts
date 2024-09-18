import express, { Application, NextFunction, Request, Response, Router } from 'express'
import { AuthorizationProvider } from '../authorization/provider'

export interface FlareRequest extends Request {}

export interface FlareResponse extends Response {
	xml?: (body: any) => this
	renderXml?: (template: string, data?: Object) => this
}

export interface FlareNext extends NextFunction {}

export interface FlareExpressApp extends Application {
	auth?: AuthorizationProvider
}

export interface FlareExpressRouter extends Router {
	auth?: AuthorizationProvider
}
