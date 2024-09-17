document.addEventListener('DOMContentLoaded', function () {
    // כפתור למעבר למצב כהה
    document.getElementById('toggle-dark-mode').addEventListener('click', function () {
        document.body.classList.toggle('dark-mode');
    });

    // משתנה לסוג האירוע
    let eventType = 'birthday';

    // טיפול בלחיצות על כפתורי סוג האירוע
    const eventButtons = document.querySelectorAll('.event-type-button');
    eventButtons.forEach(button => {
        button.addEventListener('click', function () {
            // הסרת מחלקה 'active' מכל הכפתורים
            eventButtons.forEach(btn => btn.classList.remove('active'));
            // הוספת מחלקה 'active' לכפתור שנלחץ
            this.classList.add('active');
            // עדכון סוג האירוע
            eventType = this.getAttribute('data-type');
            // עדכון ה-UI בהתאם
            updateUIForEventType();
        });
    });

    function updateUIForEventType() {
        const mainTitle = document.getElementById('main-title');
        const mainIcon = document.getElementById('main-icon');
        const dateLabel = document.getElementById('date-label');
        const resultsTitle = document.getElementById('results-title');

        if (eventType === 'birthday') {
            mainTitle.innerHTML = '<i id="main-icon" class="fas fa-birthday-cake"></i> מחולל ימי הולדת בתאריך עברי';
            dateLabel.textContent = 'תאריך לידה לועזי (DD/MM/YYYY)';
            resultsTitle.textContent = 'תאריכי ימי הולדת לועזיים';
        } else if (eventType === 'anniversary') {
            mainTitle.innerHTML = '<i id="main-icon" class="fas fa-ring"></i> מחולל ימי נישואין בתאריך עברי';
            dateLabel.textContent = 'תאריך נישואין לועזי (DD/MM/YYYY)';
            resultsTitle.textContent = 'תאריכי ימי נישואין לועזיים';
        } else if (eventType === 'memorial') {
            mainTitle.innerHTML = '<i id="main-icon" class="fas fa-candle"></i> מחולל ימי אזכרה בתאריך עברי';
            dateLabel.textContent = 'תאריך פטירה לועזי (DD/MM/YYYY)';
            resultsTitle.textContent = 'תאריכי ימי אזכרה לועזיים';
        }
    }

    // פונקציה לפורמט תאריך עבור Google Calendar (ללא שעה)
    function formatGoogleCalendarDate(year, month, day) {
        return `${year}${month.toString().padStart(2, '0')}${day.toString().padStart(2, '0')}`;
    }

    // פונקציה להמרת האירועים
    document.getElementById('event-form').addEventListener('submit', async function (e) {
        e.preventDefault();

        const name = document.getElementById('name').value;
        let [day, month, year] = document.getElementById('gregorian-date').value.split('/').map(Number);
        const afterSunset = document.getElementById('after-sunset').checked;
        if (afterSunset) {
            // הוספת יום אחד לתאריך אם נבחר "אחרי שקיעה"
            const date = new Date(year, month - 1, day);
            date.setDate(date.getDate() + 1);
            day = date.getDate();
            month = date.getMonth() + 1;
            year = date.getFullYear();
        }
        const originalYear = year;
        const originalMonth = month;
        const originalDay = day;
        const startYear = parseInt(document.getElementById('start-year').value);
        const endYear = parseInt(document.getElementById('end-year').value);

        // אימות טווח השנים
        if (endYear < startYear) {
            alert('שנת הסיום חייבת להיות שווה או גדולה משנת ההתחלה.');
            return;
        }

        // הצגת ספינר טעינה
        document.getElementById('loading-spinner').style.display = 'inline-block';

        const eventList = document.getElementById('event-list');
        eventList.innerHTML = ''; // נקה תוצאות קודמות
        const events = []; // לאיסוף נתונים עבור CSV

        try {
            // קריאה ל-API של Hebcal להמרת תאריך לועזי לעברי עבור התאריך המקורי
            const response = await fetch(`https://www.hebcal.com/converter?cfg=json&gy=${originalYear}&gm=${originalMonth}&gd=${originalDay}&g2h=1`);
            const hebcalData = await response.json();

            // בדיקת שגיאות בתגובה
            if (hebcalData.error) {
                alert('תאריך לועזי לא תקין. אנא ודא שהזנת את התאריך בפורמט DD/MM/YYYY.');
                document.getElementById('loading-spinner').style.display = 'none';
                return;
            }

            // הצגת התאריך העברי כפי שהתקבל מה-API עבור התאריך המקורי
            const hebrewDate = `${hebcalData.hebrew}`;
            document.getElementById('hebrew-date').textContent = `תאריך עברי: ${hebrewDate}`;

            // לולאה עבור כל שנה בטווח
            for (let year = startYear; year <= endYear; year++) {
                const age = year - originalYear;

                // קריאה ל-API עבור כל שנה בטווח כדי להמיר את התאריך העברי חזרה ללועזי
                const eventResponse = await fetch(`https://www.hebcal.com/converter?cfg=json&hy=${hebcalData.hy + age}&hm=${hebcalData.hm}&hd=${hebcalData.hd}&h2g=1`);
                const eventData = await eventResponse.json();

                // יצירת טקסטים בהתאם לסוג האירוע
                let eventText = '';
                let eventTitle = '';
                if (eventType === 'birthday') {
                    eventText = `יום הולדת ל${name} ${age} (עברי - ${eventData.hebrew})`;
                    eventTitle = `יום הולדת ל${name} ${age} (עברי)`;
                } else if (eventType === 'anniversary') {
                    eventText = `יום נישואין ל${name} ${age} (עברי - ${eventData.hebrew})`;
                    eventTitle = `יום נישואין ל${name} ${age} (עברי)`;
                } else if (eventType === 'memorial') {
                    eventText = `יום אזכרה ל${name} (${eventData.hebrew})`;
                    eventTitle = `יום אזכרה ל${name}`;
                }

                // יצירת פריט רשימה
                const listItem = document.createElement('li');
                listItem.innerHTML = `<strong>${eventData.gd}/${eventData.gm}/${eventData.gy}</strong> - ${eventText}`;

                // יצירת כפתורים מתחת לכל אירוע
                const buttonsContainer = document.createElement('div');
                buttonsContainer.classList.add('event-buttons');

                // יצירת תאריכים בפורמט המתאים
                const startDate = formatGoogleCalendarDate(eventData.gy, eventData.gm, eventData.gd);

                // חישוב endDate על ידי הוספת יום אחד ל-startDate
                const endDateObj = new Date(eventData.gy, eventData.gm - 1, eventData.gd);
                endDateObj.setDate(endDateObj.getDate() + 1);
                const endDate = formatGoogleCalendarDate(endDateObj.getFullYear(), endDateObj.getMonth() + 1, endDateObj.getDate());

                // יצירת קישורים להוספה ליומנים
                const googleLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${startDate}/${endDate}&ctz=Asia/Jerusalem`;

                const outlookLink = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(eventTitle)}&startdt=${eventData.gy}-${eventData.gm.toString().padStart(2, '0')}-${eventData.gd.toString().padStart(2, '0')}`;

                const appleLink = `data:text/calendar;charset=utf8,BEGIN:VCALENDAR%0AVERSION:2.0%0ABEGIN:VEVENT%0ASUMMARY:${encodeURIComponent(eventTitle)}%0ADTSTART;VALUE=DATE:${startDate}%0AEND:VEVENT%0AEND:VCALENDAR`;

                const button1 = document.createElement('a');
                button1.textContent = 'הוסף ליומן Google';
                button1.href = googleLink;
                button1.target = '_blank';
                button1.classList.add('small-button');

                const button2 = document.createElement('a');
                button2.textContent = 'הוסף ל-Outlook';
                button2.href = outlookLink;
                button2.target = '_blank';
                button2.classList.add('small-button');

                const button3 = document.createElement('a');
                button3.textContent = 'הורד קובץ .ics לאייפון';
                button3.href = appleLink;
                button3.download = `event_${name}_${year}.ics`;
                button3.classList.add('small-button');

                buttonsContainer.appendChild(button1);
                buttonsContainer.appendChild(button2);
                buttonsContainer.appendChild(button3);

                listItem.appendChild(buttonsContainer);
                eventList.appendChild(listItem);

                // שמירת הנתונים עבור CSV
                events.push({
                    event: eventTitle,
                    date: `${eventData.gd}/${eventData.gm}/${eventData.gy}`
                });
            }

            // הצגת כפתור להורדת קובץ CSV
            document.getElementById('download-csv').style.display = 'inline-block';

            // כפתור ייצוא ל-CSV
            document.getElementById('download-csv').addEventListener('click', function () {
                let csvContent = "data:text/csv;charset=utf-8,";
                csvContent += "Subject,Start Date\n"; // כותרות עמודות

                events.forEach(function(event) {
                    csvContent += `${event.event},${event.date}\n`; // הוספת כל תאריך ואירוע
                });

                const encodedUri = encodeURI(csvContent);
                const link = document.createElement('a');
                link.setAttribute('href', encodedUri);
                link.setAttribute('download', 'events.csv');
                document.body.appendChild(link); // נדרש עבור Firefox
                link.click();
                document.body.removeChild(link); // נקה לאחר ההורדה
            });

        } catch (error) {
            console.error('Error fetching Hebcal API:', error);
            alert('אירעה שגיאה בקבלת הנתונים. אנא נסה שוב מאוחר יותר.');
        } finally {
            // הסתרת ספינר הטעינה
            document.getElementById('loading-spinner').style.display = 'none';
        }
    });
});
