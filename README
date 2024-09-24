# Express - JWT Exercise
...
### Step 2: Fix the user model
### Step 3: Fix the routes
In order, implement these routes. Make sure to check security appropriately:
 - anyone can login or register
 - any logged-in user can see the list of users
 - only that user can view their get-user-detail route, or their from-messages or to-messages routes.
 - only the sender or recipient of a message can view the message-detail route
 - only the recipient of a message can mark it as read
 - any logged in user can send a message to any other user

### Further Study
**Write Tests for Routes**

We’ve provided a commented-out test file for the authentication routes. Uncomment this and make sure it works.

 + Tests run in series rather than parallel due to race conditions with that test type.

---

### Todo
 - Working from this as an example, build integration tests for your user and message routes.

 ### **Refactoring the classes**

Note that both the ***User*** and ***Message*** classes don’t actually create instances — they’re closer to the ***Cat*** model than the ***Dog*** model when we first learned about our OOP approach to creating models in Node.

Think about which methods (if any) would make more sense as instance methods instead of static methods, and refactor your application accordingly. Similarly, if there are any instance methods that you think would make your life easier, write them and use them in the app!