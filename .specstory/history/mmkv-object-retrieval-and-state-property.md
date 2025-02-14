## SpecStory

## MMKV Object Retrieval and State Property (11/25/2024, 11:52:12 AM)

_**User**_

do you know if mmkv will return an object with "state" property in it or direclty the full object?

---

_**Assistant**_

The `mmkv.getString` method retrieves a string value from the MMKV storage. The content of this string depends on how the data was originally stored. If the data was stored as a JSON string with a structure that includes a `state` property, then `mmkv.getString` will return a string that, when parsed with `JSON.parse`, results in an object with a `state` property.

In your code snippet, it seems like you expect the stored data to be an object with a `state` property, as indicated by the line `return parsed.state;`. This implies that when the data was saved to MMKV, it was structured in such a way that the `state` property encapsulates the relevant data.

To confirm this, you should check the part of your code where data is being saved to MMKV. If the data is being saved with a structure like `{ state: { ... } }`, then your assumption is correct. If not, you might need to adjust your parsing logic accordingly.

---



---

