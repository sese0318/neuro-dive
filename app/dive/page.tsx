import type {Metadata} from 'next';
import DiveGame from './game';
export const metadata:Metadata={title:'NEURO DIVE | 脳内を歩く一人称3Dゲーム',description:'樹状突起からシナプスへ。実際の脳の3Dモデルと探索アクションで、神経の仕組みを体験するNeuroLabのゲーム。'};
export default function Page(){return <DiveGame/>;}
