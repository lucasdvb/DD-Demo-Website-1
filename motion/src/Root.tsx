import React from 'react'
import { Composition } from 'remotion'
import { Tide, Breath, Motes } from './compositions'

// 30 fps; each film is scrubbed by scroll on the site, so length = smoothness, not time
export const Root: React.FC = () => (
  <>
    <Composition id="Tide" component={Tide} durationInFrames={180} fps={30} width={1920} height={1080} />
    <Composition id="Breath" component={Breath} durationInFrames={180} fps={30} width={1440} height={1440} />
    <Composition id="Motes" component={Motes} durationInFrames={180} fps={30} width={1920} height={1080} />
  </>
)
