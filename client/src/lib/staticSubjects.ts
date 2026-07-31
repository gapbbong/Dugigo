import aeSubj1 from '@/data/자동화설비산업기사/01. 1과목_기계공작법 및 기계제도.json';
import aeSubj2 from '@/data/자동화설비산업기사/02. 2과목_유공압 및 기계자동화.json';
import aeSubj3 from '@/data/자동화설비산업기사/03. 3과목_자동화시스템 및 제어공학.json';

export const STATIC_SUBJECT_FILES: Record<string, { fileName: string; data: any[] }[]> = {
  '자동화설비산업기사': [
    { fileName: '01. 1과목_기계공작법 및 기계제도.json', data: aeSubj1 as any[] },
    { fileName: '02. 2과목_유공압 및 기계자동화.json', data: aeSubj2 as any[] },
    { fileName: '03. 3과목_자동화시스템 및 제어공학.json', data: aeSubj3 as any[] },
  ],
  '자동화설비 산업기사': [
    { fileName: '01. 1과목_기계공작법 및 기계제도.json', data: aeSubj1 as any[] },
    { fileName: '02. 2과목_유공압 및 기계자동화.json', data: aeSubj2 as any[] },
    { fileName: '03. 3과목_자동화시스템 및 제어공학.json', data: aeSubj3 as any[] },
  ],
};
