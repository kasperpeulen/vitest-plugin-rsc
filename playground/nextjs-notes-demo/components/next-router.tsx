'use client'
import { type AppRouterActionQueue } from 'next/dist/client/components/app-router-instance'
import { AppRouter } from './app-router-provider'
import { createInitialRouterState } from 'next/dist/client/components/router-reducer/create-initial-router-state'
import {
  type CacheNodeSeedData,
  type FlightDataPath,
  type FlightRouterState
} from 'next/dist/server/app-render/types'
import { type ReactNode } from 'react'
import { buildFlightRouterState } from './tree'
import { fn } from '@vitest/spy'
import type { ReducerActions } from 'next/dist/client/components/router-reducer/router-reducer-types'

const _dispatch = fn<(payload: ReducerActions) => void>()
declare global {
  var dispatch: typeof _dispatch
}
globalThis.dispatch = _dispatch

export const NextRouter = ({
  children,
  route = '/',
  url = '/'
}: {
  children: ReactNode
  route?: string
  url?: string
}) => {
  const location = new URL(url, 'http://localhost')

  const actionQueue: AppRouterActionQueue = {
    state: createInitialRouterState({
      navigatedAt: Date.now(),
      initialFlightData: createFlightData({
        initialTree: buildFlightRouterState(
          route,
          location.pathname,
          location.search
        ),
        seedData: ['', children, {}, null, false],
        initialHead: null,
        isPossiblyPartialHead: false
      }),
      initialCanonicalUrlParts: location.pathname.split('/'),
      initialParallelRoutes: new Map(),
      location: location as unknown as Location,
      couldBeIntercepted: false,
      postponed: false,
      prerendered: false
    }),
    dispatch: (payload, setState) => {
      globalThis.dispatch(payload)
    },
    action: async (state, action) => {
      throw new Error('action called')
      return state
    },
    pending: null,
    last: null,
    onRouterTransitionStart: null
  }

  return <AppRouter actionQueue={actionQueue}></AppRouter>
}

function createFlightData(props: {
  initialTree: FlightRouterState
  seedData: CacheNodeSeedData
  initialHead: ReactNode | null
  isPossiblyPartialHead: boolean
}): FlightDataPath {
  return [
    [
      props.initialTree,
      props.seedData,
      props.initialHead,
      props.isPossiblyPartialHead
    ]
  ]
}
