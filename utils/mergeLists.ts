export function mergeOrderedLists<L1, L2>(
  list1: L1[],
  list2: L2[],
  list1Order: (a: L1) => number,
  list2Order: (a: L2) => number
): (L1 | L2)[] {
  // Merge 2 sorted lists
  const merged = [];
  let i = 0;
  let j = 0;

  while (i < list1.length && j < list2.length) {
    if (list1Order(list1[i]) < list2Order(list2[j])) {
      merged.push(list1[i]);
      i++;
    } else {
      merged.push(list2[j]);
      j++;
    }
  }
  while (i < list1.length) {
    merged.push(list1[i]);
    i++;
  }
  while (j < list2.length) {
    merged.push(list2[j]);
    j++;
  }

  return merged;
}
