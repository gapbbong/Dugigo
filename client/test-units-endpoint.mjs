import { GET } from './src/app/api/units/route.ts';

const mockReq = {
  url: 'http://localhost/api/units?subject=전기기사'
};

async function test() {
  try {
    const response = await GET(mockReq);
    const json = await response.json();
    console.log("Units returned:");
    json.units.forEach(u => {
      console.log(`- name: "${u.name}", count: ${u.count}, isPart: ${u.isPart}`);
    });
  } catch (e) {
    console.error("Test failed:", e);
  }
}

test();
