const header = document.querySelector('header');
const main = document.querySelector('main')
const allTagsButton = document.querySelector('#AllTagsButton')

allTagsButton.addEventListener('click', () => {
    const tagButtons = document.querySelectorAll('.tagButton.active');
    tagButtons.forEach(tagButton => {
        tagButton.classList.remove('active');
    })
    allTagsButton.className = 'tagButton active'
});
var likedQuotesIds = []

fetch('https://api.quotable.io/tags')
.then(response => response.json())
.then(tags => {
    tags.sort((a, b) => b.quoteCount - a.quoteCount);
    const header = document.querySelector('header');
    tags.forEach(tag => {
        const tagButton = document.createElement('button');
        tagButton.textContent = `${tag.name} ${tag.quoteCount}`;
        tagButton.className = 'tagButton';
        tagButton.addEventListener('click', () => {
            tagButton.className = 'tagButton active'
            allTagsButton.className = 'tagButton'
        })
        header.appendChild(tagButton);
    });
})
.catch(error => console.error('Error fetching tags:', error));

fetch('https://api.quotable.io/quotes')
.then(response => response.json())
.then(quotes => {
    quotes.results.forEach((quote, index) => {
        const quoteDiv = document.createElement('div');
        quoteDiv.className = "quoteDiv";
        const contentDiv = document.createElement('div');
        contentDiv.className = "content";
        const authorA = document.createElement('a');
        authorA.className = "author";
        authorA.addEventListener('click', () => openAuthorWiki(quote.authorSlug))
        const authorImg = document.createElement('img');
        authorImg.className = "authorImg";
        authorImg.src = `https://images.quotable.dev/profile/200/${quote.authorSlug}.jpg`;
        const authorName = document.createTextNode(quote.author);
        const quoteP = document.createElement('p');
        quoteP.className = "quote";
        quoteP.textContent = quote.content;
        const hr = document.createElement('hr');
        authorA.appendChild(authorImg);
        authorA.appendChild(authorName);
        contentDiv.appendChild(authorA);
        contentDiv.appendChild(hr);
        contentDiv.appendChild(quoteP);
        const quoteButtonsDiv = document.createElement('div');
        quoteButtonsDiv.className = "quoteButtonsDiv";
        const quoteButton = document.createElement('button');
        quoteButton.className = "quoteButton";
        quoteButton.textContent = likedQuotesIds.includes(quote._id) ? "❤️" : "🤍";
        quoteButton.addEventListener('click', () => {
            const isLiked = likedQuotesIds.includes(quote._id);
            if (isLiked) {
                const index = likedQuotesIds.indexOf(quote._id);
                if (index !== -1) {
                    likedQuotesIds.splice(index, 1);
                }
                quoteButton.textContent = "🤍";
            } else {
                likedQuotesIds.push(quote._id);
                quoteButton.textContent = "❤️";
            }
        });
        const shareButton = document.createElement('button');
        shareButton.className = "quoteButton";
        shareButton.textContent = "🌐";
        shareButton.addEventListener('click', () => shareContent(quote.author, quote.content));

        const translateButton = document.createElement('button');
        translateButton.className = "quoteButton";
        translateButton.textContent = "🇷🇺";
        translateButton.addEventListener('click', () => window.open(`https://translate.google.com/?sl=en&tl=ru&text=${quote.content}&op=translate`, '_blank'));

        quoteButtonsDiv.appendChild(quoteButton);
        quoteButtonsDiv.appendChild(shareButton);
        quoteButtonsDiv.appendChild(translateButton);

        quoteDiv.appendChild(contentDiv);
        quoteDiv.appendChild(quoteButtonsDiv);
        
        main.appendChild(quoteDiv);
    });
})
.catch(error => console.error('Error fetching quotes:', error));

const shareContent = async (title, text) => {
    try {
        await navigator.share({
            title: title,
            text: text,
        });
        console.log('Shared successfully');
    } catch (error) {
        console.error('Error sharing:', error);
    }
};

const openAuthorWiki = async (slug) => {
    try {
        const response = await fetch(`https://api.quotable.io/authors/slug/${slug}`);
        const author = await response.json();
        if (author.link) {
            window.open(author.link, '_blank');
        } else {
            alert('Author link not found.');
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
};
