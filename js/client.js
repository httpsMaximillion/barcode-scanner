document.getElementById("isbn").addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    fetchBookData();
  }
});

function getCondition() {
  const conditionValue = document.querySelector(
    'input[name="condition-value"]:checked'
  );
  if (conditionValue) {
    return conditionValue.id;
  } else {
    return null;
  }
}

function fetchBookData() {
  let box_number = document.getElementById("box-number").value.trim();
  let isbn_number = document.getElementById("isbn").value.trim();
  let condition = getCondition();

  let book_container = document.getElementById("book-container");
  let book_cover = document.getElementById("book-cover");
  let title = document.getElementById("title");
  let author = document.getElementById("author");
  let publisher = document.getElementById("publisher");
  let link = document.getElementById("amazon-link");

  let status = document.getElementById("status");

  switch (true) {
    case !box_number:
      status.style.color = "red";
      status.textContent = "Please enter a box number.";
      setTimeout(function () {
        status.style.color = "blue";
        status.textContent = "Currently waiting for scanned barcode...";
      }, 1000);
      return;

    case !Number.isInteger(Number(box_number)):
      status.style.color = "red";
      status.textContent = "Invalid box number.";
      setTimeout(function () {
        status.style.color = "blue";
        status.textContent = "Currently waiting for scanned barcode...";
      }, 1000);
      return;

    case !isbn_number:
      status.style.color = "red";
      status.textContent = "Please enter an ISBN number.";
      setTimeout(function () {
        status.style.color = "blue";
        status.textContent = "Currently waiting for scanned barcode...";
      }, 1000);
      return;

    case !Number.isInteger(Number(isbn_number)):
      status.style.color = "red";
      status.textContent = "Invalid ISBN number.";
      setTimeout(function () {
        status.style.color = "blue";
        status.textContent = "Currently waiting for scanned barcode...";
      }, 1000);
      return;

    case condition == null:
      status.style.color = "red";
      status.textContent = "Please select the condition.";
      setTimeout(function () {
        status.style.color = "blue";
        status.textContent = "Currently waiting for scanned barcode...";
      }, 1000);
      return;
  }

  fetch(`https://openlibrary.org/isbn/${isbn_number}.json`)
    .then((response) => response.json())
    .then((data) => {
      const data_title = data.title;
      const data_publishers = data.publishers
        ? data.publishers.join(", ")
        : "No Publisher Info";
      const data_book_cover = `https://covers.openlibrary.org/b/isbn/${isbn_number}-M.jpg`;
      const authorKey = data.authors[0].key;

      fetch(`https://openlibrary.org${authorKey}.json`)
        .then((authorResponse) => authorResponse.json())
        .then((authorData) => {
          const data_authors = authorData.name;

          title.textContent = `Title: ${data_title}`;
          author.textContent = `Author(s): ${data_authors}`;
          publisher.textContent = `Publisher(s): ${data_publishers}`;
          book_cover.src = data_book_cover;
          link.href = `https://www.amazon.com/s?k=${isbn_number}`;

          status.style.color = "green";
          status.textContent = "Book scanned successfully!";
          book_container.style.visibility = "visible";
          document.getElementById("isbn").value = '';

          saveBookData(
            box_number,
            isbn_number,
            condition,
            data_title,
            data_authors,
            data_publishers,
            data_book_cover,
            link.href
          );
        })
        .catch((error) => {
          console.error("Error fetching author data:", error);
          status.style.color = "red";
          status.textContent = "Error fetching author data.";
        });
    })
    .catch((error) => {
      console.error("Error fetching book data:", error);
      status.style.color = "red";
      status.textContent = "Error fetching book data.";
    });
}

function saveBookData(
  box_number,
  isbn_number,
  condition,
  title,
  author,
  publisher,
  cover,
  amazon
) {
  const bookData = {
    box_number,
    isbn_number,
    condition,
    title,
    author,
    publisher,
    cover,
    amazon,
  };

  fetch("http://localhost:8080/add-book", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(bookData),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Book added:", data);
    })
    .catch((error) => {
      console.error("Error adding book:", error);
    });
}
