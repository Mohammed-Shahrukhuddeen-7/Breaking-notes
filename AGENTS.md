# Project architecture decisions

- Theme preference is shared through a React context and stored in local storage; CSS semantic tokens switch via the document's `data-theme` attribute so all authenticated screens follow the same setting.