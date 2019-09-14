import $ from "jquery"
import { executeQuery, loadFiles } from "./main"

class LoadingButton {
  private button: JQuery<HTMLElement>
  private spinner: JQuery<HTMLElement>

  constructor(buttonId: string, spinnerId: string) {
    this.button = $(buttonId)
    this.spinner = $(spinnerId)
  }

  get isLoading(): boolean {
    return this.button.hasClass("hidden");
  }

  set isLoading(status: boolean) {
    if (status) {
      this.spinner.removeClass("hidden");
      this.button.addClass("hidden")
    } else {
      this.spinner.addClass("hidden");
      this.button.removeClass("hidden")
    }
  }
}

export const fileLoadButton = new LoadingButton("#load-button", "#load-button-spinner")
export const processingButton = new LoadingButton("#process-button", "#process-button-spinner")

const logView = <HTMLDivElement>document.getElementById("logView")!;

export function log(msg: string) {
  const date = new Date();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  const milliseconds = date.getMilliseconds().toString().padStart(3, "0");

  const line = document.createElement("span")!;
  const strong = document.createElement("strong")!;
  line.appendChild(document.createTextNode("[" + hours + ":" + minutes + ":" + seconds + ":" + milliseconds + "]  "))
  strong.appendChild(document.createTextNode(msg));
  line.appendChild(strong)
  line.appendChild(document.createElement("br"));
  logView.appendChild(line);

  logView.scrollTop = logView.scrollHeight;
}

const results = <HTMLDivElement>document.getElementById('results')!;

let fragments = new Array<string>();

export function appendResultFragment(fragment: string) {
  fragments.push(fragment)

  if (shouldLoadNextFragment || $(window).height() === $(document).height())
    tryAppendFragmentView()
}

let shouldLoadNextFragment = true
function tryAppendFragmentView() {
  if (fragments.length === 0) {
    shouldLoadNextFragment = true
    return
  }

  const div = <HTMLParagraphElement>document.createElement("p");
  div.innerText = fragments[0];
  results.appendChild(div);

  fragments.shift();

  shouldLoadNextFragment = false
}

export function clearResultView() {
  while (results.firstChild) {
    results.removeChild(results.firstChild);
  }
  fragments = new Array<string>();
}

window.addEventListener('scroll', (event: Event) => {
  if (<number>$(window).scrollTop() + <number>$(window).height() === $(document).height())
    tryAppendFragmentView()
})

document.getElementById('files')!.addEventListener('change', async (event: any) => {
  fileLoadButton.isLoading = true
  try {
    const loadedFiles = await loadFiles(event.target.files)

    const list = document.createElement("ul");

    for (let i = 0, f; f = loadedFiles[i]; i++) {
      const file = f
      const entry = document.createElement("li")!
      entry.innerHTML = `<strong>${escape(file.name)}</strong>(${file.type || "n/a"}) - ${file.size} bytes`

      list.appendChild(entry);
    }

    document.getElementById('list')!.appendChild(list);
  } finally {
    fileLoadButton.isLoading = false
  }
}, false);

document.getElementById("process-button")!.addEventListener("click", async (e: Event) => {
  clearResultView();

  processingButton.isLoading = true
  try {
    await executeQuery((<HTMLTextAreaElement>document.getElementById("query")!).value)
  } catch (error) {
    log(error.toString())
  } finally {
    processingButton.isLoading = false
  }
});