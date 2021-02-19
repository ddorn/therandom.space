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
    let elem_centerx = elem_rect.left + elem_rect.width / 2;
    let top = elem_rect.top - tip_rect.height - 12;
    let left = elem_centerx - tip_rect.width / 2;

    if (left + tip_rect.width > window.innerWidth) {
        left = window.innerWidth - tip_rect.width - 3;
    } else if (left < 0) {
        left = 3;
    }
    let prop = (elem_centerx - left) / tip_rect.width;
    tip.style.setProperty('--tip-position', prop * 100 + '%')

    tip.style.left = left + 'px';
    tip.style.top = top + 'px';
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