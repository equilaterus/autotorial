import React from 'react';
import {Composition, registerRoot} from 'remotion';
import type {ProducedLesson} from '../core/types';
import {FPS, LessonComposition, sceneFrames} from '../web/components/LessonComposition';

const placeholder: ProducedLesson = {schemaVersion: 1, slug: 'lesson', title: 'Lesson', language: 'en', objectives: [], prerequisites: [], scenes: [{id: 'empty', type: 'concept', title: 'Lesson', body: '', narration: '', duration: 3}], exercises: [], audio: [], producedAt: '', sourceHash: '', totalDuration: 3};

const Root = () => <Composition id="Lesson" component={LessonComposition} durationInFrames={90} fps={FPS} width={1280} height={720} defaultProps={{lesson: placeholder}} calculateMetadata={({props}) => ({durationInFrames: props.lesson.scenes.reduce((total, scene) => total + sceneFrames(scene), 0)})}/>;

registerRoot(Root);
