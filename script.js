document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('header');
    const main = document.querySelector('main');
    const allTagsButton = document.querySelector('#allTagsButton');
    const addQuoteForm = document.querySelector('#addQuoteForm');
    const myQuotesButton = document.querySelector('#myQuotesButton');
    const likedQuotesButton = document.querySelector('#likedQuotesButton');
    let selectedTags = [];
    let quotes = [];
    const likedQuotes = localStorage.getItem("likedQuotes") ? JSON.parse(localStorage.getItem("likedQuotes")) : [];
    const myQuotes = localStorage.getItem("myQuotes") ? JSON.parse(localStorage.getItem("myQuotes")) : [];
    let currentPage = 1;
    let state = "all"

    const createTagButton = (tag) => {
        const tagButton = document.createElement('button');
        tagButton.textContent = `${tag.name} ${tag.quoteCount}`;
        tagButton.className = 'tagButton';

        tagButton.addEventListener('click', () => {
            if (selectedTags.includes(tag.slug)) {
                tagButton.classList.remove('active');
                selectedTags = selectedTags.filter(t => t !== tag.slug);
            } else {
                tagButton.classList.add('active');
                selectedTags.push(tag.slug);
            }

            allTagsButton.classList.toggle('active', selectedTags.length === 0);
            myQuotesButton.classList.remove('active')
            likedQuotesButton.classList.remove('active')
            currentPage = 1
            quotes = []
            fetchQuotes();
        });

        return tagButton;
    };

    const fetchQuotes = async () => {
        try {
            const response = await fetch(`https://api.quotable.io/quotes?sortBy=length&page=${currentPage}&tags=${selectedTags.join("|")}`);
            if (!response.ok) {
                throw new Error('Network response was not ok.');
            }
            const { results } = await response.json();
            quotes = [...quotes, ...results];
            renderQuotes();
        } catch (error) {
            console.error('Error fetching quotes:', error);
        }
    };

    const fetchLikedQuotes = () => renderQuotes(likedQuotes.reverse());
    const fetchMyQuotes = () => renderQuotes(myQuotes.reverse(), true);

    const renderQuotes = (quotesToRender = quotes) => {
        document.querySelectorAll('.quoteDiv').forEach(element => {
            element.remove();
        });
        quotesToRender.forEach(quote => {
            main.appendChild(createQuoteElement(quote));
        });
    };

    const toggleLikeQuote = (quote, button) => {
        const index = likedQuotes.findIndex(q => q._id === quote._id);
        if (index !== -1) {
            likedQuotes.splice(likedQuotes.findIndex(q => q._id === quote._id), 1);
            button.textContent = "🤍";
        } else {
            likedQuotes.push(quote);
            button.textContent = "❤️";
        }
        localStorage.setItem("likedQuotes", JSON.stringify(likedQuotes))
    };

    const createQuoteElement = (quote) => {
        const { author, content, authorSlug, _id } = quote;
        const quoteDiv = document.createElement('div');
        quoteDiv.className = 'quoteDiv';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'content';

        const authorA = document.createElement('a');
        authorA.className = 'author';
        authorA.addEventListener('click', () => openAuthorWiki(authorSlug));

        const authorImg = quote.isMine ? document.createElement('p') : document.createElement('img');
        authorImg.className = 'authorImg';
        if (!quote.isMine) {
            authorImg.src = `https://images.quotable.dev/profile/200/${authorSlug}.jpg`;
        } else {
            authorImg.textContent = '👤';
        }

        const quoteP = document.createElement('p');
        quoteP.className = 'quote';
        quoteP.textContent = content;

        authorA.appendChild(authorImg);
        authorA.appendChild(document.createTextNode(author));
        contentDiv.append(authorA, document.createElement('hr'), quoteP);

        const quoteButtonsDiv = document.createElement('div');
        quoteButtonsDiv.className = 'quoteButtonsDiv';

        const buttons = [
            { text: likedQuotes.findIndex(q => q._id === quote._id) !== -1 ? '❤️' : '🤍' },
            { text: '🔗', onClick: () => shareContent(author, content) },
            { text: '🇷🇺', onClick: () => window.open(`https://translate.google.com/?sl=en&tl=ru&text=${content}&op=translate`, '_blank') }
        ];

        if (quote.isMine) {
            buttons.push({ text: '🗑️', onClick: () => deleteQuote(quote, quoteDiv) });
        }

        buttons.forEach(({ text, onClick }) => {
            const button = document.createElement('button');
            button.className = 'quoteButton';
            button.textContent = text;
            button.addEventListener('click', onClick || (() => toggleLikeQuote(quote, button)));
            quoteButtonsDiv.appendChild(button);
        });

        quoteDiv.append(contentDiv, quoteButtonsDiv);
        return quoteDiv;
    };

    const deleteQuote = (quote, quoteDiv) => {
        myQuotes.splice(myQuotes.findIndex(q => q._id === quote._id), 1);
        localStorage.setItem("myQuotes", JSON.stringify(myQuotes))
        likedQuotes.splice(likedQuotes.findIndex(q => q._id === quote._id), 1);
        localStorage.setItem("likedQuotes", JSON.stringify(likedQuotes))
        quoteDiv.remove()
    };

    const shareContent = async (title, text) => {
        try {
            await navigator.share({ title, text });
        } catch (error) {
            console.log('Error sharing:', error);
        }
    };

    const openAuthorWiki = async (slug) => {
        const url = slug !== 'quote'
            ? (await fetch(`https://api.quotable.io/authors/slug/${slug}`).then(res => res.json())).link || 'https://en.wikipedia.org/wiki/Quote'
            : 'https://en.wikipedia.org/wiki/Quote';

        window.open(url, '_blank');
    };

    const handleButtonClick = (button, fetchFunction) => {
        selectedTags = [];
        document.querySelectorAll('.tagButton.active').forEach(activeButton => activeButton.classList.remove('active'));
        button.classList.add('active');
        fetchFunction();
    };

    allTagsButton.addEventListener('click', () => handleButtonClick(allTagsButton, () => {currentPage = 1; quotes = []; fetchQuotes(); state = "all"}));
    likedQuotesButton.addEventListener('click', () => handleButtonClick(likedQuotesButton, () => {fetchLikedQuotes(); state = "liked"}));
    myQuotesButton.addEventListener('click', () => handleButtonClick(myQuotesButton, () => {fetchMyQuotes(); state = "my"}));

    addQuoteForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const author = document.getElementById('authorInput').value.trim();
        const content = document.getElementById('quoteInput').value.trim();
        if (author && content) {
            myQuotes.push({ _id: myQuotes.length, author, content, authorSlug: 'quote', isMine: true });
            localStorage.setItem("myQuotes", JSON.stringify(myQuotes))
            document.getElementById('authorInput').value = '';
            document.getElementById('quoteInput').value = '';
            handleButtonClick(myQuotesButton, fetchMyQuotes);
        }
    });

    fetch('https://api.quotable.io/tags')
        .then(response => response.json())
        .then(tags => {
            tags.sort((a, b) => b.quoteCount - a.quoteCount);
            tags.forEach(tag => {
                header.appendChild(createTagButton(tag));
            });
        })
        .catch(error => alert('Error fetching tags:', error));

    function handleScroll() {
        const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
        if (scrollTop + clientHeight >= scrollHeight - 5) {
            currentPage++;
            if(state == 'all'){
                fetchQuotes();
            }
        }
    }

    window.addEventListener('scroll', handleScroll);
    fetchQuotes();
});
