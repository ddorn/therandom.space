let liked = JSON.parse(localStorage.getItem('liked'));
if (!liked) liked = [];

function make_like_button(like_button, quote_elem, kind) {
    // Already liked ? Orange button
    if (liked.indexOf(quote_elem.innerText) !== -1) {
        like_button.style.color = '#ffa500'
    }
    // Click toggles likes
    like_button.addEventListener('click', _ => {
        let already = liked.indexOf(quote_elem.innerText) === -1;
        fetch('/api/like/' + kind, {
        // fetch('{{ url_for("like", kind=title.lower()) }}', {
            method: already ? 'post' : 'delete',  // Remove like if liked
            body: JSON.stringify({ quote: quote_elem.innerText, }),
            headers: { 'Content-Type': 'application/json' },
        }).then(resp => resp.json()
            .then(data => {
                like_button.children[0].innerText = data.likes;
                like_button.style.color = already ? "#ffa500" : 'white';
                if (already) {
                    liked.push(quote_elem.innerText)
                } else {
                    liked.splice(liked.indexOf(quote_elem.innerText), 1)
                }
                localStorage.setItem('liked', JSON.stringify(liked))
            })
        )
    })
}
