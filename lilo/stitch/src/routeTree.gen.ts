/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file was automatically generated by TanStack Router.
// You should NOT make any changes in this file as it will be overwritten.
// Additionally, you should also exclude this file from your linter and/or formatter to prevent it from being checked or modified.

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as WorkflowImport } from './routes/workflow'
import { Route as IndexImport } from './routes/index'
import { Route as WorkflowNewImport } from './routes/workflow.new'
import { Route as WorkflowWorkflowIdImport } from './routes/workflow.$workflowId'

// Create/Update Routes

const WorkflowRoute = WorkflowImport.update({
  id: '/workflow',
  path: '/workflow',
  getParentRoute: () => rootRoute,
} as any)

const IndexRoute = IndexImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => rootRoute,
} as any)

const WorkflowNewRoute = WorkflowNewImport.update({
  id: '/new',
  path: '/new',
  getParentRoute: () => WorkflowRoute,
} as any)

const WorkflowWorkflowIdRoute = WorkflowWorkflowIdImport.update({
  id: '/$workflowId',
  path: '/$workflowId',
  getParentRoute: () => WorkflowRoute,
} as any)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexImport
      parentRoute: typeof rootRoute
    }
    '/workflow': {
      id: '/workflow'
      path: '/workflow'
      fullPath: '/workflow'
      preLoaderRoute: typeof WorkflowImport
      parentRoute: typeof rootRoute
    }
    '/workflow/$workflowId': {
      id: '/workflow/$workflowId'
      path: '/$workflowId'
      fullPath: '/workflow/$workflowId'
      preLoaderRoute: typeof WorkflowWorkflowIdImport
      parentRoute: typeof WorkflowImport
    }
    '/workflow/new': {
      id: '/workflow/new'
      path: '/new'
      fullPath: '/workflow/new'
      preLoaderRoute: typeof WorkflowNewImport
      parentRoute: typeof WorkflowImport
    }
  }
}

// Create and export the route tree

interface WorkflowRouteChildren {
  WorkflowWorkflowIdRoute: typeof WorkflowWorkflowIdRoute
  WorkflowNewRoute: typeof WorkflowNewRoute
}

const WorkflowRouteChildren: WorkflowRouteChildren = {
  WorkflowWorkflowIdRoute: WorkflowWorkflowIdRoute,
  WorkflowNewRoute: WorkflowNewRoute,
}

const WorkflowRouteWithChildren = WorkflowRoute._addFileChildren(
  WorkflowRouteChildren,
)

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '/workflow': typeof WorkflowRouteWithChildren
  '/workflow/$workflowId': typeof WorkflowWorkflowIdRoute
  '/workflow/new': typeof WorkflowNewRoute
}

export interface FileRoutesByTo {
  '/': typeof IndexRoute
  '/workflow': typeof WorkflowRouteWithChildren
  '/workflow/$workflowId': typeof WorkflowWorkflowIdRoute
  '/workflow/new': typeof WorkflowNewRoute
}

export interface FileRoutesById {
  __root__: typeof rootRoute
  '/': typeof IndexRoute
  '/workflow': typeof WorkflowRouteWithChildren
  '/workflow/$workflowId': typeof WorkflowWorkflowIdRoute
  '/workflow/new': typeof WorkflowNewRoute
}

export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths: '/' | '/workflow' | '/workflow/$workflowId' | '/workflow/new'
  fileRoutesByTo: FileRoutesByTo
  to: '/' | '/workflow' | '/workflow/$workflowId' | '/workflow/new'
  id: '__root__' | '/' | '/workflow' | '/workflow/$workflowId' | '/workflow/new'
  fileRoutesById: FileRoutesById
}

export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  WorkflowRoute: typeof WorkflowRouteWithChildren
}

const rootRouteChildren: RootRouteChildren = {
  IndexRoute: IndexRoute,
  WorkflowRoute: WorkflowRouteWithChildren,
}

export const routeTree = rootRoute
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()

/* ROUTE_MANIFEST_START
{
  "routes": {
    "__root__": {
      "filePath": "__root.tsx",
      "children": [
        "/",
        "/workflow"
      ]
    },
    "/": {
      "filePath": "index.tsx"
    },
    "/workflow": {
      "filePath": "workflow.tsx",
      "children": [
        "/workflow/$workflowId",
        "/workflow/new"
      ]
    },
    "/workflow/$workflowId": {
      "filePath": "workflow.$workflowId.tsx",
      "parent": "/workflow"
    },
    "/workflow/new": {
      "filePath": "workflow.new.tsx",
      "parent": "/workflow"
    }
  }
}
ROUTE_MANIFEST_END */
