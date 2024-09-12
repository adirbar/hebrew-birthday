document.getElementById('birthdate-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const originalDate = document.getElementById('gregorian-date').value.split('/');
    const originalYear = parseInt(originalDate[2]);
    const originalMonth = parseInt(originalDate[1]);
    const originalDay = parseInt(originalDate[0]);
    const startYear = parseInt(document.getElementById('start-year').value);
    const endYear = parseInt(document.getElementById('end-year').value);

    // הצגת ספינר טעינה
    document.getElementById('loading-spinner').style.display = 'inline-block';

    const birthdayList = document.getElementById('birthday-list');
    birthdayList.innerHTML = ''; // נקה תוצאות קודמות
    const birthdays = []; // לאיסוף נתונים עבור CSV

    try {
        // קריאה ל-API של Hebcal להמרת תאריך לועזי לעברי עבור השנה הראשונה (תאריך לידה מקורי)
        const response = await fetch(`https://www.hebcal.com/converter?cfg=json&gy=${originalYear}&gm=${originalMonth}&gd=${originalDay}&g2h=1`);
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

            const googleLink = `https://calendar.google.com/calendar/r/eventedit?text=יום+הולדת+ל${name}+${age}&dates=${birthdayData.gy}${birthdayData.gm.toString().padStart(2, '0')}${birthdayData.gd.toString().padStart(2, '0')}/${birthdayData.gy}${birthdayData.gm.toString().padStart(2, '0')}${birthdayData.gd.toString().padStart(2, '0')}`;
            const outlookLink = `https://outlook.live.com/calendar/0/deeplink/compose?subject=יום+הולדת+ל${name}+${age}&startdt=${birthdayData.gy}-${birthdayData.gm.toString().padStart(2, '0')}-${birthdayData.gd.toString().padStart(2, '0')}`;
            const appleLink = `data:text/calendar;charset=utf8,BEGIN:VCALENDAR%0AVERSION:2.0%0ABEGIN:VEVENT%0ASUMMARY:יום+הולדת+ל${name}+${age}%0ADTSTART:${birthdayData.gy}${birthdayData.gm.toString().padStart(2, '0')}${birthdayData.gd.toString().padStart(2, '0')}%0AEND:VEVENT%0AEND:VCALENDAR`;

            const listItem = document.createElement('li');
            listItem.innerHTML = `${birthday} 
                <a href="${googleLink}" target="_blank" class="calendar-button">הוסף ל-Google Calendar</a>
                <a href="${outlookLink}" target="_blank" class="calendar-button">הוסף ל-Outlook</a>
                <a href="${appleLink}" download="birthday_${name}_${age}.ics" class="calendar-button">הוסף ל-Apple Calendar</a>`;
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

// פתיחת הסרטון במודאל
document.getElementById('tutorial-button').addEventListener('click', function () {
    document.getElementById('tutorial-modal').style.display = 'block';
});

// סגירת המודאל והפסקת הסרטון
document.getElementsByClassName('close')[0].addEventListener('click', function () {
    document.getElementById('tutorial-modal').style.display = 'none';
    const video = document.getElementById('youtube-video');
    video.contentWindow.postMessage('{"event":"command","func":"stopVideo","args":""}', '*');
});

// סגירת המודאל כאשר לוחצים מחוץ לו והפסקת הסרטון
window.addEventListener('click', function (event) {
    if (event.target == document.getElementById('tutorial-modal')) {
        document.getElementById('tutorial-modal').style.display = 'none';
        const video = document.getElementById('youtube-video');
        video.contentWindow.postMessage('{"event":"command","func":"stopVideo","args":""}', '*');
    }
});
