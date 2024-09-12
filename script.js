document.getElementById('birthdate-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const originalDate = new Date(document.getElementById('gregorian-date').value);
    const originalYear = originalDate.getFullYear();
    const startYear = parseInt(document.getElementById('start-year').value);
    const endYear = parseInt(document.getElementById('end-year').value);

    // הצגת ספינר טעינה
    document.getElementById('loading-spinner').style.display = 'inline-block';

    const birthdayList = document.getElementById('birthday-list');
    birthdayList.innerHTML = ''; // נקה תוצאות קודמות
    const birthdays = []; // לאיסוף נתונים עבור CSV

    try {
        // קריאה ל-API של Hebcal להמרת תאריך לועזי לעברי עבור השנה הראשונה (תאריך לידה מקורי)
        const response = await fetch(`https://www.hebcal.com/converter?cfg=json&gy=${originalYear}&gm=${originalDate.getMonth() + 1}&gd=${originalDate.getDate()}&g2h=1`);
        const hebcalData = await response.json();

        // הצגת התאריך העברי כפי שהתקבל מה-API עבור תאריך הלידה המקורי
        const hebrewDate = `${hebcalData.hebrew}`;
        document.getElementById('hebrew-birthday').textContent = `תאריך עברי: ${hebrewDate}`;

        // לולאה עבור כל שנה בטווח
        for (let year = startYear; year <= endYear; year++) {
            const age = year - originalYear;

            // קריאה ל-API עבור כל שנה בטווח כדי להמיר את התאריך העברי חזרה ללועזי
            const birthdayResponse = await fetch(`https://www.hebcal.com/converter?cfg=json&hy=${hebcalData.hy + age}&hm=${hebcalData.hm}&hd=${hebcalData.hd}&h2g=1`);
            const birthdayData = await birthdayResponse.json();

            // הוספת התאריך הלועזי והעברי לרשימת ימי ההולדת
            const birthday = `${birthdayData.gd}/${birthdayData.gm}/${birthdayData.gy} - יום הולדת ל${name} ${age} (עברי - ${birthdayData.hebrew})`;
            const listItem = document.createElement('li');
            listItem.textContent = birthday;
            birthdayList.appendChild(listItem);

            // שמירת הנתונים עבור CSV
            birthdays.push({
                event: `יום הולדת ל${name} ${age} (עברי - ${birthdayData.hebrew})`,
                date: `${birthdayData.gd}/${birthdayData.gm}/${birthdayData.gy}`
            });
        }

        // הצגת כפתור להורדת קובץ CSV
        document.getElementById('download-csv').style.display = 'inline-block';

        // כפתור ייצוא ל-CSV
        document.getElementById('download-csv').addEventListener('click', function () {
            let csvContent = "data:text/csv;charset=utf-8,";
            csvContent += "Subject,Start Date\n"; // כותרות עמודות

            birthdays.forEach(function(birthday) {
                csvContent += `${birthday.event},${birthday.date}\n`; // הוספת כל תאריך ואירוע
            });

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement('a');
            link.setAttribute('href', encodedUri);
            link.setAttribute('download', 'birthdays.csv');
            document.body.appendChild(link); // נדרש עבור Firefox
            link.click();
            document.body.removeChild(link); // נקה לאחר ההורדה
        });

    } catch (error) {
        console.error('Error fetching Hebcal API:', error);
    } finally {
        // הסתרת ספינר הטעינה
        document.getElementById('loading-spinner').style.display = 'none';
    }
});

// כפתור למעבר למצב כהה
document.getElementById('toggle-dark-mode').addEventListener('click', function () {
    document.body.classList.toggle('dark-mode');
});
