/*
 * If no matching events happened on a particular day, it will be missing
 * from the data set.  We want to fill in those days, and mark them as
 * having 0 events.
 */
export const dataWithoutGaps = (dataWithGaps) => {
  // Assumes data is sorted by date.
  const labels = [];
  const dataPoints = [];
  let expected = null;
  dataWithGaps.forEach(({count, date}) => {
    const day = new Date(date);
    if (!expected) expected = day;
    while (expected < day) {
      labels.push(formatDate(expected));
      dataPoints.push(0);
      // Increment date by 1 day
      expected.setDate(expected.getDate() + 1)
    }
    labels.push(formatDate(day));
    dataPoints.push(count);
    expected = new Date(day);
    expected.setDate(expected.getDate() + 1)
  });
  return {labels, dataPoints};
}

function formatDate(day) {
  return day.toUTCString().split(' ').slice(0, 4).join(' ')
}

