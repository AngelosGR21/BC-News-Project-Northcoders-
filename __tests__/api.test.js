const request = require("supertest");
const app = require("../app")

const db = require("../db/connection");
const seed = require("../db/seeds/seed");
const testData = require("../db/data/test-data/index.js");
require('jest-sorted');

afterAll(() => {
   return db.end();
})


beforeEach(() => {
    return seed(testData);
})

describe("GET /api", () => {
    test("checking route's status code", () => {
        return request(app).get("/api").expect(200)
    })
})

describe("GET /api/topics", () => {
    test("Returns an array of topic objects, each with the properties ~ slug and description", () => {
        return request(app).get("/api/topics").expect(200).then((res) => {
            const {topics} = res.body;

            topics.forEach((topic) => {
                expect(topic).toMatchObject({
                    slug : expect.any(String),
                    description : expect.any(String) 
                })
            })
        })
    })
})

describe("GET /api/articles/:article_id && Testing error handling", () => {
    test("Returns an object with the article found, the article should contain all 6 properties", () => {
        return request(app).get("/api/articles/1").expect(200).then((res) => {
            const { article } = res.body;
            expect(article).toMatchObject({
                author : "butter_bridge",
                title : "Living in the shadow of a great man",
                article_id : 1,
                body : "I find this existence challenging",
                topic : "mitch",
                created_at : "2020-07-09T20:11:00.000Z",
                votes : 100,
            })
        })
    })
    test("Checks for the key comment_count, with the total count of comments", () => {
        return request(app).get("/api/articles/1").expect(200).then((res) => {
            const {article} = res.body;
            expect(article).toHaveProperty("comment_count", "11");
        })
    })
    test("Returns 404 when the article with the id specified was not found", () => {
        return request(app).get("/api/articles/9999").expect(404).then((res) => {
            const { message } = res.body;

            expect(message).toBe("Article was not found")
        })
    })
    test("Returns 400 when a wrong data type was inserted", () => {
        return request(app).get("/api/articles/testingEndpoint").expect(400).then((res) => {
            const { message } = res.body

            expect(message).toBe("Bad request");
        })
    })
})

describe("PATCH /api/articles/:article_id && Testing error handling", () => {
    test("Increments the total number of votes", () => {
        const votesObj = { inc_votes : 5 };
        return request(app).patch("/api/articles/1").send(votesObj).expect(200).then((res) => {
            const { updatedArticle } = res.body;
            expect(updatedArticle).toMatchObject({
                title: "Living in the shadow of a great man",
                topic: "mitch",
                author: "butter_bridge",
                body: "I find this existence challenging",
                created_at: "2020-07-09T20:11:00.000Z",
                votes: 105,
            })
        })
    })
    test("Decrements the total number of votes", () => {
        const votesObj = { inc_votes : -5 };
        return request(app).patch("/api/articles/1").send(votesObj).expect(200).then((res) => {
            const { updatedArticle } = res.body;
            expect(updatedArticle).toMatchObject({
                title: "Living in the shadow of a great man",
                topic: "mitch",
                author: "butter_bridge",
                body: "I find this existence challenging",
                created_at: "2020-07-09T20:11:00.000Z",
                votes: 95,
            })
        })
    })
    test("400 ~ Bad request (wrong data type inserted)", () => {
        const votesObj = {inc_votes : "Test"};
        return request(app).patch("/api/articles/1").send(votesObj).expect(400).then((res) => {
            const { message } = res.body;
            expect(message).toBe("Bad request");
        })
    })
    test("400 ~ Bad request (values missing)", () => {
        const votesObj = {randomKey : 3};
        return request(app).patch("/api/articles/1").send(votesObj).expect(400).then((res) => {
            const { message } = res.body;
            expect(message).toBe("Some values are missing");
        })
    })
    test("404 ~ Bad request (id passed is invalid)", () => {
        const votesObj = {inc_votes : 3};
        return request(app).patch("/api/articles/9999").send(votesObj).expect(404).then((res) => {
            const { message } = res.body;
            expect(message).toBe("Article was not found");
        })
    })
    test("400 ~ Bad request (when a wrong data type was inserted)", () => {
        const votesObj = {inc_votes : 3};
        return request(app).patch("/api/articles/testingEndpoint").send(votesObj).expect(400).then((res) => {
            const { message } = res.body

            expect(message).toBe("Bad request");
        })
    })
})

describe("GET /api/users", () => {
    test("Returns an array of user objects, each with the properties ~ username, name and avatar", () => {
        return request(app).get("/api/users").expect(200).then((res) => {
            const {users} = res.body;
            expect(users).toHaveLength(4);
            users.forEach((user) => {
                expect(user).toMatchObject({
                    username: expect.any(String),
                    name: expect.any(String),
                    avatar_url: expect.any(String)
                })
            })
        })
    })
})

describe("GET /api/users/:username && Testing error handling", () => {
    test("200 - Returns a user object when the username exists", () => {
        return request(app).get("/api/users/butter_bridge").expect(200).then((res) => {
            const {user} = res.body;
            expect(user).toMatchObject({
                username: "butter_bridge",
                name: "jonny",
                avatar_url: "https://www.healthytherapies.com/wp-content/uploads/2016/06/Lime3.jpg"
            })
        })
    })
    test("404 - Returns an error when the user was not found", () => {
        return request(app).get("/api/users/invalidusername").expect(404).then((res) => {
            const {message} = res.body;
            expect(message).toBe("User was not found")
        })
    })
})

describe("GET /api/articles", () => {
    test("Checking each each article structure", () => {
        return request(app).get("/api/articles").expect(200).then((res) => {
            const {articles} = res.body;
            expect(articles).toHaveLength(12);
            articles.forEach((article) => {
                expect(article).toMatchObject({
                    author: expect.any(String),
                    title: expect.any(String),
                    article_id : expect.any(Number),
                    topic: expect.any(String),
                    created_at : expect.any(String),
                    votes: expect.any(Number),
                    comment_count : expect.any(String),
                })
            })
        })
    })
    test("Checking that the articles are sorted in descending order based on the date", () => {
        
        return request(app).get("/api/articles").expect(200).then((res) => {
            const {articles} = res.body;
            expect(articles).toBeSortedBy("created_at", {descending : true});
        })
    })
    test("200 - Adding 'sort_by' inside the query", () => {
        return request(app).get("/api/articles?sort_by=comment_count").expect(200).then((res) => {
            const {articles} = res.body;
            expect(articles).toBeSortedBy("comment_count", {descending: true, coerce: true})
        })
    })
    test("200 - Adding 'order' inside the query", () => {
        return request(app).get("/api/articles?sort_by=votes&order=ASC").expect(200).then((res) => {
            const {articles} = res.body;
            expect(articles).toBeSortedBy("votes");
        })
    })
    test("200 - Adding 'topic' inside the query", () => {
        return request(app).get("/api/articles?topic=cats").expect(200).then((res) => {
            const {articles} = res.body;
            expect(articles).toHaveLength(1);
            articles.forEach((article) => {
                expect(article.topic).toBe("cats");
            })
        })
    })
    test("200 - Testing complete query", () => {
        return request(app).get("/api/articles?topic=mitch&sort_by=votes&order=ASC").expect(200).then((res) => {
            const {articles} = res.body;
            expect(articles).toHaveLength(11);
            expect(articles).toBeSortedBy("votes");
            articles.forEach((article) => {
                expect(article.topic).toBe("mitch");
            })
        })
    })
    test("200 - Topic exists but has no articles", () => {
        return request(app).get("/api/articles?topic=paper").expect(200).then((res) => {
            const {articles} = res.body;
            expect(articles).toEqual([]);
        })
    })
    test("400 - Setting invalid sort_by value", () => {
        return request(app).get("/api/articles?sort_by=apples").expect(400).then((res) => {
            const {message} = res.body;
            expect(message).toBe("Invalid sort_by value");
        })
    })
    test("404 - Setting invalid topic value", () => {

        return request(app).get("/api/articles?topic=apples").expect(404).then((res) => {
            const {message} = res.body;
            expect(message).toBe("Topic was not found");
        })
    })
    test("400 - Invalid topic data type", () => {

        return request(app).get("/api/articles?topic=12312312312").expect(400).then((res) => {
            const {message} = res.body;
            expect(message).toBe("Invalid topic data type");
        })
    })
    test("400 - Setting invalid order value", () => {

        return request(app).get("/api/articles?order=teaieoada").expect(400).then((res) => {
            const {message} = res.body;
            expect(message).toBe("Invalid order value");
        })
    })
})

describe("GET /api/articles/:article_id/comments && Testing error handling", () => {
    test("200 - Returns an array of comment objects", () => {
        return request(app).get("/api/articles/1/comments").expect(200).then((res) => {
            const {comments} = res.body;
            expect(comments).toHaveLength(11);
            comments.forEach((comment) => {
                expect(comment).toMatchObject({
                    comment_id : expect.any(Number),
                    votes : expect.any(Number),
                    created_at : expect.any(String),
                    author : expect.any(String),
                    body : expect.any(String)
                })
            })
        })
    })
    test("200 - article is a valid id in the db, but has no comments associated with it", () => {
        return request(app).get("/api/articles/7/comments").expect(200).then((res) => {
            const {comments} = res.body;
            expect(comments).toHaveLength(0);
        })
    })
    test("400 - Bad request (passing incorrect data type)", () => {
        return request(app).get("/api/articles/test/comments").expect(400).then((res) => {
            const {message} = res.body;
            expect(message).toBe("Bad request");
        })
    })
    test("404 - Not found (passing an inexistent id)", () => {
        return request(app).get("/api/articles/9999/comments").expect(404).then((res) => {
            const { message } = res.body;
            expect(message).toBe("Article was not found");
        })
    })
})

describe("POST /api/articles/:article_id/comments && Testing error handling", () => {
    test("201 - Creates a new comment for the specified article", () => {
        const testBody = {username: "butter_bridge", body: "This is a test"};
        return request(app).post("/api/articles/7/comments").send(testBody).expect(201).then((res) => {
            const { comment } = res.body;
            expect(comment).toMatchObject({
                body: "This is a test",
                author : "butter_bridge",
                votes : 0,
                created_at : expect.any(String),
                comment_id : 19
            })
        })
    })
    test("400 - All values are missing", () => {
        return request(app).post("/api/articles/7/comments").send({}).expect(400).then((res) => {
            const {message} = res.body;
            expect(message).toBe("Some values are missing");
        })
    })
    test("400 - Some values are missing", () => {
        return request(app).post("/api/articles/7/comments").send({body: "testing"}).expect(400).then((res) => {
            const {message} = res.body;
            expect(message).toBe("Some values are missing");
        })
    })
    test("400 - Incorrect data type passed for article id", () => {
        return request(app).post("/api/articles/dsadsdas/comments").send({body: "testing"}).expect(400).then((res) => {
            const {message} = res.body;
            expect(message).toBe("Bad request");
        })
    })
    test("404 - Article passed was not found", () => {
        const testBody = {username: "butter_bridge", body: "This is a test"};
        return request(app).post("/api/articles/99999/comments").send(testBody).expect(404).then((res) => {
            const {message} = res.body;
            expect(message).toBe("Article was not found")
        })
    })
    test("404 - Username passed was not found", () => {
        const testBody = {username: "dsadsadsadsa", body: "This is a test"};
        return request(app).post("/api/articles/3/comments").send(testBody).expect(404).then((res) => {
            const {message} = res.body;
            expect(message).toBe("User was not found")
        })
    })
})

describe("PATCH /api/comments/:comment_id && Testing error handling", () => {
    test("200 - Increments the total number of votes", () => {
        const votes = {inc_votes: 1}
        return request(app).patch("/api/comments/1").send(votes).then((res) => {
            const {updatedComment} = res.body;
            expect(updatedComment).toMatchObject({
                comment_id: 1,
                body: "Oh, I've got compassion running out of my nose, pal! I'm the Sultan of Sentiment!",
                article_id: 9,
                author: 'butter_bridge',
                votes: 17,
                created_at: '2020-04-06T12:17:00.000Z'
            })
        })
    } )

    test("200 - Decrements the total number of votes", () => {
        const votes = {inc_votes: -1}
        return request(app).patch("/api/comments/1").send(votes).then((res) => {
            const {updatedComment} = res.body;
            expect(updatedComment).toMatchObject({
                comment_id: 1,
                body: "Oh, I've got compassion running out of my nose, pal! I'm the Sultan of Sentiment!",
                article_id: 9,
                author: 'butter_bridge',
                votes: 15,
                created_at: '2020-04-06T12:17:00.000Z'
            })
        })
    })
    test("400 - value of property inc_votes is invalid", () => {
        const votes = {inc_votes : -15}
        return request(app).patch("/api/comments/1").send(votes).then((res) => {
            const {message} = res.body;
            expect(message).toBe("inc_votes can only be 1 or -1");
        });
    })
})

describe("DELETE /api/comments/:comment_id", () => {
    test("204 - No content, comment was deleted", () => {
        return request(app).delete("/api/comments/1").expect(204).then((res) => {
            expect(res.body).toEqual({});
        })
    })
    test("404 - Comment with the id was not found", () => {
        return request(app).delete("/api/comments/9999999").expect(404).then((res) => {
            const {message} = res.body;
            expect(message).toBe("Comment was not found")
        })
    })
    test("404 - Wrong data type inserted", () => {
        return request(app).delete("/api/comments/monkey").expect(400).then((res) => {
            const {message} = res.body;
            expect(message).toBe("Invalid data type (id)")
        })
    })
})

describe("GET (inexistent endpoint) ~ Should return error", () => {
    test("/api/topicsss ~ 404", () => {
        return request(app).get("/api/topicsss").expect(404).then((res) => {
            const {message} = res.body;
            expect(message).toBe("Endpoint not found");
        })
    })
})
