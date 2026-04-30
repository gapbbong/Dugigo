const apiKey = 'AIzaSyDznL1UlJrBFqZLKotoLW9NiQVs_zxk5OU';
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

async function list() {
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.models) {
      data.models.forEach(m => console.log(m.name));
    } else {
      console.log(data);
    }
  } catch (err) {
    console.error(err);
  }
}
list();
