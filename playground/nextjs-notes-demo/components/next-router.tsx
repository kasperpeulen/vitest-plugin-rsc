'use client'
import { type AppRouterActionQueue } from 'next/dist/client/components/app-router-instance'
import { AppRouter } from './app-router-provider'
import { createInitialRouterState } from 'next/dist/client/components/router-reducer/create-initial-router-state'
import {
  type CacheNodeSeedData,
  type FlightDataPath,
  type FlightRouterState
} from 'next/dist/server/app-render/types'
import { type ReactNode, useState } from 'react'
import { buildFlightRouterState } from './tree'
import { fn, type Mock } from '@vitest/spy'

declare global {
  var onNavigate: Mock<(url: URL) => void>
}
globalThis.onNavigate = fn<(url: URL) => void>()

export const NextRouter = ({
  children,
  url = '/',
  route
}: {
  children: ReactNode
  route?: string
  url?: string
}) => {
  route ??= url
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
      if (payload.type === 'navigate') {
        globalThis.onNavigate(payload.url)
      }
    },
    action: async (state, action) => {
      throw new Error('action not implemented')
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
