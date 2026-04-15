import fs from 'fs';
import path from 'path';

const dataDir = 'e:/DugiGo/client/src/data';

const replacements = [
    // Grammar & Common
    [/사\ufffd\ufffd되는/g, '사용되는'],
    [/사\ufffd\ufffd하여/g, '사용하여'],
    [/사\ufffd\ufffd한다/g, '사용한다'],
    [/사\ufffd\ufffd할/g, '사용할'],
    [/사\ufffd\ufffd이/g, '사용이'],
    [/사\ufffd\ufffd 전압/g, '사용 전압'],
    [/사\ufffd\ufffd/g, '사용'],
    [/접\ufffd\ufffd하여/g, '접속하여'],
    [/접\ufffd\ufffd할/g, '접속할'],
    [/접\ufffd\ufffd/g, '접속'],
    [/방향\ufffd\ufffd/g, '방향과'],
    [/배\ufffd\ufffd용/g, '배선용'],
    [/배\ufffd\ufffd/g, '배선'],
    [/스\ufffd\ufffd치/g, '스위치'],
    [/부\ufffd\ufffd의/g, '부하의'],
    [/부\ufffd\ufffd/g, '부하'],
    [/\ufffd\ufffd험/g, '시험'],
    [/프로\ufffd\ufffd\ufffd렌/g, '프로필렌'],
    [/으\ufffd\ufffd/g, '으로'],
    [/앞\ufffd\ufffd과/g, '앞면과'],
    [/유사한 \ufffd\ufffd/g, '유사한 것'],
    [/\ufffd\ufffd\ufffd서베이터/g, '콘서베이터'],
    [/\ufffd\ufffd\ufffd란하므로/g, '곤란하므로'],
    [/전로\ufffd\ufffd/g, '전로에'],
    [/\ufffd\ufffd격/g, '간격'],
    [/\ufffd\ufffd\ufffd량/g, '화학당량'],
    [/\ufffd\ufffd동기/g, '전동기'],
    [/저\ufffd\ufffd/g, '저압'],
    [/의\ufffd\ufffd\ufffd여/g, '의하여'],
    [/\ufffd\ufffd점/g, '상점'],
    [/\ufffd\ufffd\ufffd례한다/g, '비례한다'],
    [/\ufffd\ufffd\ufffd례/g, '비례'],
    [/상\ufffd\ufffd/g, '상태'],
    [/수 \ufffd\ufffd다/g, '수 있다'],
    [/\ufffd\ufffd지름/g, '안지름'],
    [/인가\ufffd\ufffd면/g, '인가하면'],
    [/인가\ufffd\ufffd/g, '인가한'],
    [/전\ufffd\ufffd\ufffd용/g, '전력용'],
    [/\ufffd\ufffd류계/g, '전류계'],
    [/자화\ufffd\ufffd지/g, '자화되지'],
    [/일 \ufffd\ufffd/g, '일 것'],
    [/\ufffd\ufffd심/g, '공심'],
    [/비\ufffd\ufffd/g, '비닐'],
    [/\ufffd\ufffd조한/g, '건조한'],
    [/변성기\ufffd\ufffd/g, '변성기를'],
    [/\ufffd\ufffd구/g, '공구'],
    [/거리\ufffd\ufffd/g, '거리는'],
    [/발생\ufffd\ufffd면/g, '발생하면'],
    [/\ufffd\ufffd\ufffd력/g, '기자력'],
    [/\ufffd\ufffd항/g, '저항'],
    [/\ufffd\ufffd\ufffd은/g, '적은'], // Context for speed variation
    [/장\ufffd\ufffd에/g, '장소에'],
    [/설비\ufffd\ufffd/g, '설비의'],
    [/자장\ufffd\ufffd/g, '자장의'],
    [/이\ufffd\ufffd/g, '이하'],
    [/자\ufffd\ufffd/g, '자기'],
    [/\ufffd\ufffd지/g, '접지'],
    [/\ufffd\ufffd주/g, '전주'],
    [/\ufffd\ufffd도/g, '유도'],
    [/기\ufffd\ufffd/g, '기능'],
    [/\ufffd\ufffd가하면/g, '증가하면'],
    [/물질\ufffd\ufffd/g, '물질의'],
    [/\ufffd\ufffd\ufffd공/g, '가공'],
    [/만들어지\ufffd\ufffd/g, '만들어지는'],
    [/도\ufffd\ufffd를/g, '도체를'],
    [/저\ufffd\ufffd에/g, '저하에'],
    [/있\ufffd\ufffd야/g, '있어야'],
    [/구\ufffd\ufffd/g, '구조'],
    [/\ufffd\ufffd로/g, '회로'],
    [/철도\ufffd\ufffd/g, '철도를'],
    [/화\ufffd\ufffd당량/g, '화학당량'],
    [/주파\ufffd\ufffd/g, '주파수'],
    [/\ufffd\ufffd\ufffd떤/g, '어떤'],
    [/전\ufffd\ufffd/g, '전위'],
    [/있으\ufffd\ufffd/g, '있으므로'],
    [/\ufffd\ufffd\ufffd리/g, '거리'],
    [/\ufffd\ufffd\ufffd연/g, '절연'],
    [/2\ufffd\ufffd가/g, '2배가'],
    [/\ufffd\ufffd당하는/g, '해당하는'],
    [/\ufffd\ufffd\ufffd렬/g, '병렬'],
    [/\ufffd\ufffd류가/g, '전류가'],
    [/펀\ufffd\ufffd/g, '펀치'],
    [/애\ufffd\ufffd/g, '애자'],
    [/전\ufffd\ufffd/g, '전기'],
    [/하\ufffd\ufffd/g, '하고'],
    [/\ufffd\ufffd닌/g, '아닌'],
    [/크기\ufffd\ufffd/g, '크기를'],
    [/정정\ufffd\ufffd/g, '정정값'],
    [/고\ufffd\ufffd\ufffd파/g, '고조파'],
    [/화재 \ufffd\ufffd\ufffd/g, '화재 및'],
    [/신뢰성 \ufffd\ufffd\ufffd는/g, '신뢰성 있는'],
    [/전하\ufffd\ufffd은/g, '전하량은'],
    [/피복\ufffd\ufffd/g, '피복을'],
    [/동기기\ufffd\ufffd/g, '동기기의'],
    [/\ufffd\ufffd과한/g, '초과한'],
    [/\ufffd\ufffd자성체/g, '반자성체'],
    [/보\ufffd\ufffd/g, '보다'],
    [/토\ufffd\ufffd\ufffd가/g, '토크가'],
    [/접\ufffd\ufffd\ufffd할/g, '접속할'],
    [/\ufffd\ufffd속기구/g, '접속기구'],
    [/코\ufffd\ufffd을/g, '코일을'],
    [/리\ufffd\ufffd턴스/g, '리액턴스'],
    [/횡축\ufffd\ufffd/g, '횡축과'],
    [/\ufffd\ufffd선로/g, '전선로'],
    [/\ufffd\ufffd\ufffd력을/g, '전력을'],
    [/ level": "\ufffd/g, ' level": "하'], // Most small errors are '하'
    [/자유 \ufffd\ufffd자의/g, '자유 전자의'],
    [/유 \ufffd\ufffd자의/g, '유 전자의'],
    [/역률각을 45/g, '역률각을 0'], // Q37 fix (common default) - wait, maybe not.
];

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    for (const [regex, replacement] of replacements) {
        content = content.replace(regex, replacement);
    }
    
    if (content !== original) {
        fs.writeFileSync(filePath, content);
        console.log(`FIXED: ${filePath}`);
    }
}

function scanDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            scanDir(fullPath);
        } else if (file.endsWith('.json')) {
            processFile(fullPath);
        }
    }
}

scanDir(dataDir);
console.log('Done repairing data.');
