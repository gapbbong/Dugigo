import { GET } from './src/app/api/summaries/route.ts';

const mockReq = {
  url: 'http://localhost/api/summaries?subject=전기기사&unit=01.%20전기자기학%20(1부)&set=1'
};

async function test() {
  try {
    const response = await GET(mockReq);
    console.log("Status:", response.status);
    const json = await response.json();
    console.log("JSON response:", json);
  } catch (e) {
    console.error("Test failed with error:", e);
  }
}

test();
