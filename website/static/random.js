let liked = JSON.parse(localStorage.getItem('liked'));
if (!liked) liked = [];


function isLiked(quote) {
    return liked.indexOf(quote) !== -1
}

function make_like_button(like_button, quote_elem, kind) {
    // Directly set the right color
    if (isLiked(quote_elem.innerText)) {
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

/// Add an automatic tooltip above an element.
/// Text can be a string or a function returning one.
function make_tooltip(elem, text) {
    let tip = null;
    let has_tip = false;

    function cancelTip() {
        if (tip) {
            tip.remove();
            tip = null;
        }
    }

    function showTip() {
        if (has_tip || tip) return;
        tip = create_tip(elem, text)
        has_tip = true;
    }

    elem.addEventListener('click', cancelTip)
    elem.addEventListener('mouseover', showTip)
    elem.addEventListener('mouseleave', cancelTip)
    elem.addEventListener('mouseleave', _ => has_tip = false)
}

/// Create a tooltip above an element.
/// Text can be a string or a function returning one.
function create_tip(elem, text) {
    let tip = document.createElement('div');

    tip.appendChild(document.createTextNode(text instanceof Function ? text() : text));
    tip.className = 'tooltip';
    document.body.appendChild(tip);

    // Positioning
    let elem_rect = elem.getBoundingClientRect();
    let tip_rect = tip.getBoundingClientRect();
    console.log(tip_rect.height, elem_rect.top)
    let top = elem_rect.top - tip_rect.height - 12 + 'px';
    tip.style.left = elem_rect.left + elem_rect.width / 2 - tip_rect.width / 2 + 'px'
    tip.style.top = top;

    return tip;
}


function copy(text) {
    var textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    document.execCommand('copy')
    document.body.removeChild(textArea)
}