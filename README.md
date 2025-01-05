# get-platform-icons

get icons for the platform

## to run this script:

first, you need to have a list of `Platform`, where:

<code>
interface Platform {
  name: string;
  url: string;
}
</code>

then, use `scrapeIcons` function and pass the `platforms` as argument. It should create a directory named `icons`, with icons created using `platform.name`.